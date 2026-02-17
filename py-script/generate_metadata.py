import json
from pathlib import Path
from db import COUNTRY_FLAG_CODES, FLAG_BASE_URL, city_country_metadata


def get_flag_slug(country: str) -> str | None:
    code = COUNTRY_FLAG_CODES.get(country.lower(), "xx") # xx is for unknown flags
    return f"{FLAG_BASE_URL}{code}.svg"


def _project_root() -> Path:
    return Path(__file__).resolve().parents[1]


def _photos_dir() -> Path:
    return _project_root() / "src" / "content" / "photos"


def _metadata_path() -> Path:
    return _project_root() / "src" / "content" / "metadata.json"

def build_metadata() -> list[dict[str, object]]:
    """Scan photo folders, persist aggregate metadata, and return it."""

    photos_dir = _photos_dir()
    metadata = []

    for city, country in city_country_metadata.items():
        city_dir = photos_dir / city
        mdx_files = [f for f in city_dir.glob("*.mdx") if f.is_file()] if city_dir.exists() else []

        metadata.append({
            "city": city,
            "country": country,
            "flag": get_flag_slug(country),
            "code": COUNTRY_FLAG_CODES.get(country),
            "count": len(mdx_files),
            "title": f"{city.capitalize()}, {country.capitalize()}"
        })
        
    return metadata

def write_metadata() -> None:
    """Builds the metadata then write it to metadata.json file"""
    metadata = build_metadata()

    metadata_path = _metadata_path()
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    write_metadata()