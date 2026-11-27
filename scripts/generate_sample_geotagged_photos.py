import os
import urllib.request
from PIL import Image, ImageDraw, ImageFont
import piexif
from datetime import datetime

# Real road hazard test images from Wikimedia Commons / public domain
TEST_SOURCES = [
    {
        "filename": "chennai_pothole_mount_road.jpg",
        "url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
        "lat": 13.0528,
        "lon": 80.2514,
        "label": "Anna Salai Pothole",
        "date": "2026:11:27 10:15:30"
    },
    {
        "filename": "chennai_drain_overflow_omr.jpg",
        "url": "https://images.unsplash.com/photo-1584463699027-e43e2e8587dc?w=800&auto=format&fit=crop&q=80",
        "lat": 12.9620,
        "lon": 80.2428,
        "label": "OMR Drainage Overflow",
        "date": "2026:11:27 11:20:14"
    },
    {
        "filename": "chennai_garbage_royapuram.jpg",
        "url": "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
        "lat": 13.0912,
        "lon": 80.2893,
        "label": "Royapuram Garbage",
        "date": "2026:11:27 09:45:00"
    },
    {
        "filename": "chennai_pothole_fix_mount_road.jpg",
        "url": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80",
        "lat": 13.0528,
        "lon": 80.2514,
        "label": "Anna Salai Repaired Patch",
        "date": "2026:11:27 14:00:00"
    }
]

def deg_to_dms_rational(deg_float):
    deg = int(abs(deg_float))
    min_float = (abs(deg_float) - deg) * 60
    minute = int(min_float)
    sec_float = (min_float - minute) * 60
    sec = int(round(sec_float * 10000))
    return ((deg, 1), (minute, 1), (sec, 10000))

def create_geotagged_image(src_info, out_dir):
    filepath = os.path.join(out_dir, src_info["filename"])
    
    # Download image or generate fallback if network blocked
    try:
        req = urllib.request.Request(src_info["url"], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp, open(filepath, 'wb') as f:
            f.write(resp.read())
        img = Image.open(filepath).convert("RGB")
    except Exception as e:
        print(f"Network download fallback for {src_info['filename']}: {e}")
        img = Image.new("RGB", (800, 600), color=(60, 65, 75))
        draw = ImageDraw.Draw(img)
        draw.rectangle([50, 50, 750, 550], fill=(80, 85, 95), outline=(200, 100, 50), width=4)
        draw.text((80, 80), f"TEST DEFECT: {src_info['label']}", fill=(255, 255, 255))
        draw.text((80, 120), f"GPS: {src_info['lat']}, {src_info['lon']}", fill=(200, 255, 200))
        img.save(filepath, "JPEG")

    # Construct EXIF GPS dictionary
    lat_dms = deg_to_dms_rational(src_info["lat"])
    lon_dms = deg_to_dms_rational(src_info["lon"])

    gps_ifd = {
        piexif.GPSIFD.GPSLatitudeRef: 'N',
        piexif.GPSIFD.GPSLatitude: lat_dms,
        piexif.GPSIFD.GPSLongitudeRef: 'E',
        piexif.GPSIFD.GPSLongitude: lon_dms,
    }

    exif_ifd = {
        piexif.ExifIFD.DateTimeOriginal: src_info["date"].encode('utf-8'),
        piexif.ExifIFD.DateTimeDigitized: src_info["date"].encode('utf-8'),
    }

    zeroth_ifd = {
        piexif.ImageIFD.Make: b"Apple",
        piexif.ImageIFD.Model: b"iPhone 15 Pro",
        piexif.ImageIFD.DateTime: src_info["date"].encode('utf-8'),
    }

    exif_dict = {"0th": zeroth_ifd, "Exif": exif_ifd, "GPS": gps_ifd}
    exif_bytes = piexif.dump(exif_dict)

    img.save(filepath, "JPEG", exif=exif_bytes, quality=95)
    print(f"✓ Created {filepath} with EXIF GPS: ({src_info['lat']}, {src_info['lon']})")

if __name__ == "__main__":
    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/test_images"))
    os.makedirs(out_dir, exist_ok=True)
    for src in TEST_SOURCES:
        create_geotagged_image(src, out_dir)
