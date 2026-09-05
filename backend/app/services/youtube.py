import re
import math
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

def format_seconds(seconds: Optional[float]) -> str:
    if not seconds or math.isnan(seconds) or seconds < 0:
        return "00:00"
    seconds = int(seconds)
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    secs = seconds % 60
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"

def parse_duration_string(dur_str: Optional[str]) -> int:
    if not dur_str:
        return 0
    parts = dur_str.strip().split(":")
    try:
        if len(parts) == 3:
            return int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
        elif len(parts) == 2:
            return int(parts[0]) * 60 + int(parts[1])
        elif len(parts) == 1:
            return int(parts[0])
    except (ValueError, TypeError):
        return 0
    return 0

def parse_iso8601_duration(duration_str: Optional[str]) -> int:
    if not duration_str:
        return 0
    match = re.match(r"^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$", duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds

def extract_playlist_id(url_or_id: str) -> Optional[str]:
    url_or_id = url_or_id.strip()
    # Matches list=PL... or list=UU... or list=OLAK...
    match = re.search(r"[?&]list=([a-zA-Z0-9_-]+)", url_or_id)
    if match:
        return match.group(1)
    
    # Direct playlist ID
    if re.match(r"^(PL|UU|FL|RD|OLAK)[a-zA-Z0-9_-]+$", url_or_id):
        return url_or_id
        
    return None

class YouTubeService:
    @staticmethod
    async def fetch_playlist(url_or_id: str) -> Dict[str, Any]:
        playlist_id = extract_playlist_id(url_or_id)
        if not playlist_id:
            # If it's a general URL, try passing directly to yt_dlp
            playlist_id = url_or_id.strip()

        # Strategy 1: Use YouTube Data API v3 if API key is provided
        if settings.YOUTUBE_API_KEY:
            try:
                data = await YouTubeService._fetch_via_api_v3(playlist_id, settings.YOUTUBE_API_KEY)
                if data and data.get("videos"):
                    return data
            except Exception as e:
                print(f"YouTube Data API v3 failed: {e}. Falling back to yt-dlp extractor...")

        # Strategy 2: Use yt-dlp extract_flat (fast, no download, handles any valid playlist)
        try:
            return YouTubeService._fetch_via_ytdlp(playlist_id)
        except Exception as e:
            print(f"yt-dlp extraction failed: {e}. Falling back to web extractor...")

        # Strategy 3: Direct web initialData scraper
        try:
            return await YouTubeService._fetch_via_web_scraper(playlist_id)
        except Exception as e:
            raise ValueError(f"Failed to fetch YouTube playlist. Please verify the URL: {str(e)}")

    @staticmethod
    def _fetch_via_ytdlp(playlist_id: str) -> Dict[str, Any]:
        import yt_dlp

        if not playlist_id.startswith("http"):
            url = f"https://www.youtube.com/playlist?list={playlist_id}"
        else:
            url = playlist_id

        ydl_opts = {
            'extract_flat': 'in_playlist',
            'skip_download': True,
            'quiet': True,
            'no_warnings': True,
            'ignoreerrors': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                raise ValueError("Could not extract playlist information from YouTube.")

            actual_playlist_id = info.get("id") or extract_playlist_id(url) or playlist_id
            title = info.get("title") or "YouTube Playlist"
            channel_name = info.get("uploader") or info.get("channel") or "YouTube Creator"
            description = info.get("description") or ""

            # Extract thumbnails
            thumbnail = ""
            thumbnails = info.get("thumbnails") or []
            if thumbnails:
                thumbnail = thumbnails[-1].get("url", "")

            entries = info.get("entries") or []
            videos = []
            
            for idx, entry in enumerate(entries):
                if not entry:
                    continue
                video_id = entry.get("id")
                if not video_id:
                    continue
                
                v_title = entry.get("title") or f"Video {idx + 1}"
                if v_title in ["[Private video]", "[Deleted video]"]:
                    continue

                duration_secs = entry.get("duration")
                if duration_secs is None or duration_secs == 0:
                    duration_str_raw = entry.get("duration_string") or entry.get("duration_text")
                    duration_secs = parse_duration_string(duration_str_raw)
                else:
                    duration_secs = int(duration_secs)

                duration_str = format_seconds(duration_secs)

                v_thumb = ""
                v_thumbnails = entry.get("thumbnails") or []
                if v_thumbnails:
                    v_thumb = v_thumbnails[-1].get("url", "")
                if not v_thumb:
                    v_thumb = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"

                if not thumbnail and v_thumb:
                    thumbnail = v_thumb

                videos.append({
                    "youtube_video_id": video_id,
                    "title": v_title,
                    "thumbnail": v_thumb,
                    "duration": duration_str,
                    "duration_seconds": int(duration_secs),
                    "position": idx + 1,
                    "description": entry.get("description") or ""
                })

            if not videos:
                raise ValueError("No accessible videos found in this playlist.")

            return {
                "youtube_playlist_id": actual_playlist_id,
                "title": title,
                "description": description,
                "thumbnail": thumbnail or (videos[0]["thumbnail"] if videos else ""),
                "channel_name": channel_name,
                "video_count": len(videos),
                "videos": videos
            }

    @staticmethod
    async def _fetch_via_api_v3(playlist_id: str, api_key: str) -> Dict[str, Any]:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # 1. Fetch Playlist Info
            p_res = await client.get(
                "https://www.googleapis.com/youtube/v3/playlists",
                params={"part": "snippet", "id": playlist_id, "key": api_key}
            )
            p_data = p_res.json()
            items = p_data.get("items", [])
            if not items:
                raise ValueError("Playlist not found on YouTube API")

            p_snippet = items[0]["snippet"]
            title = p_snippet.get("title", "YouTube Playlist")
            channel_name = p_snippet.get("channelTitle", "")
            description = p_snippet.get("description", "")
            thumb = p_snippet.get("thumbnails", {}).get("high", {}).get("url", "")

            # 2. Fetch Playlist Items (pages)
            raw_videos = []
            next_page = ""
            pos = 1

            while True:
                params = {
                    "part": "snippet,contentDetails",
                    "playlistId": playlist_id,
                    "maxResults": 50,
                    "key": api_key
                }
                if next_page:
                    params["pageToken"] = next_page

                i_res = await client.get("https://www.googleapis.com/youtube/v3/playlistItems", params=params)
                i_data = i_res.json()
                
                for item in i_data.get("items", []):
                    snippet = item.get("snippet", {})
                    v_id = snippet.get("resourceId", {}).get("videoId")
                    if not v_id:
                        continue
                    v_title = snippet.get("title", "")
                    if v_title in ["[Private video]", "[Deleted video]"]:
                        continue
                    
                    v_thumb = snippet.get("thumbnails", {}).get("high", {}).get("url", "")
                    if not v_thumb:
                        v_thumb = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"

                    raw_videos.append({
                        "youtube_video_id": v_id,
                        "title": v_title,
                        "thumbnail": v_thumb,
                        "duration": "00:00",
                        "duration_seconds": 0,
                        "position": pos,
                        "description": snippet.get("description", "")
                    })
                    pos += 1

                next_page = i_data.get("nextPageToken")
                if not next_page or len(raw_videos) >= 200:
                    break

            # 3. Batch fetch duration for videos
            video_ids = [v["youtube_video_id"] for v in raw_videos]
            duration_map = {}
            
            # Query in chunks of 50
            for i in range(0, len(video_ids), 50):
                chunk_ids = video_ids[i:i+50]
                try:
                    v_res = await client.get(
                        "https://www.googleapis.com/youtube/v3/videos",
                        params={"part": "contentDetails", "id": ",".join(chunk_ids), "key": api_key}
                    )
                    v_data = v_res.json()
                    for v_item in v_data.get("items", []):
                        vid = v_item.get("id")
                        iso_dur = v_item.get("contentDetails", {}).get("duration", "")
                        dur_sec = parse_iso8601_duration(iso_dur)
                        duration_map[vid] = (format_seconds(dur_sec), dur_sec)
                except Exception as e:
                    print(f"Failed to batch fetch video durations: {e}")

            # Apply durations to raw_videos
            for v in raw_videos:
                vid = v["youtube_video_id"]
                if vid in duration_map:
                    v["duration"], v["duration_seconds"] = duration_map[vid]

            return {
                "youtube_playlist_id": playlist_id,
                "title": title,
                "description": description,
                "thumbnail": thumb or (raw_videos[0]["thumbnail"] if raw_videos else ""),
                "channel_name": channel_name,
                "video_count": len(raw_videos),
                "videos": raw_videos
            }

    @staticmethod
    async def _fetch_via_web_scraper(playlist_id: str) -> Dict[str, Any]:
        url = f"https://www.youtube.com/playlist?list={playlist_id}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9"
        }
        async with httpx.AsyncClient(timeout=15.0, headers=headers) as client:
            res = await client.get(url)
            html = res.text
            
            # Find ytInitialData
            match = re.search(r"var ytInitialData\s*=\s*({.+?});</script>", html)
            if not match:
                match = re.search(r"ytInitialData\s*=\s*({.+?});", html)
            if not match:
                raise ValueError("Could not parse YouTube web page data")
            
            import json
            data = json.loads(match.group(1))

            metadata = data.get("metadata", {}).get("playlistMetadataRenderer", {})
            title = metadata.get("title", "YouTube Playlist")
            description = metadata.get("description", "")
            
            # Find contents
            tabs = data.get("contents", {}).get("twoColumnBrowseResultsRenderer", {}).get("tabs", [])
            primary_tab = tabs[0].get("tabRenderer", {}).get("content", {}) if tabs else {}
            section_list = primary_tab.get("sectionListRenderer", {}).get("contents", [])
            item_section = section_list[0].get("itemSectionRenderer", {}).get("contents", []) if section_list else []
            playlist_video_list = item_section[0].get("playlistVideoListRenderer", {}).get("contents", []) if item_section else []

            videos = []
            for idx, item in enumerate(playlist_video_list):
                v_info = item.get("playlistVideoRenderer")
                if not v_info:
                    continue
                v_id = v_info.get("videoId")
                if not v_id:
                    continue
                
                v_title = v_info.get("title", {}).get("runs", [{}])[0].get("text", f"Video {idx + 1}")
                dur_text = v_info.get("lengthText", {}).get("simpleText", "00:00")
                dur_sec = int(v_info.get("lengthSeconds", 0))

                if dur_sec == 0 and dur_text and dur_text != "00:00":
                    dur_sec = parse_duration_string(dur_text)
                elif dur_sec > 0 and dur_text == "00:00":
                    dur_text = format_seconds(dur_sec)

                v_thumb = f"https://i.ytimg.com/vi/{v_id}/hqdefault.jpg"
                thumbs = v_info.get("thumbnail", {}).get("thumbnails", [])
                if thumbs:
                    v_thumb = thumbs[-1].get("url", v_thumb)

                videos.append({
                    "youtube_video_id": v_id,
                    "title": v_title,
                    "thumbnail": v_thumb,
                    "duration": dur_text,
                    "duration_seconds": dur_sec,
                    "position": idx + 1,
                    "description": ""
                })

            return {
                "youtube_playlist_id": playlist_id,
                "title": title,
                "description": description,
                "thumbnail": videos[0]["thumbnail"] if videos else "",
                "channel_name": "YouTube Creator",
                "video_count": len(videos),
                "videos": videos
            }
