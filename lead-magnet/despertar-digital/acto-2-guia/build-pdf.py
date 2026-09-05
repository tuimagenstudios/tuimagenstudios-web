from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent
HTML = ROOT / "despertar-digital.html"
OUTPUT = ROOT / "output" / "despertar-digital-v1.pdf"

CHROME_CANDIDATES = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]


def find_browser() -> Path:
    for candidate in CHROME_CANDIDATES:
        if candidate.exists():
            return candidate
    raise RuntimeError("No Chrome or Edge executable was found.")


def main() -> int:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    browser = find_browser()
    command = [
        str(browser),
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUTPUT}",
        HTML.as_uri(),
    ]
    subprocess.run(command, check=True)
    size_kb = OUTPUT.stat().st_size / 1024
    print(f"PDF generated: {OUTPUT}")
    print(f"Size: {size_kb:.1f} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
