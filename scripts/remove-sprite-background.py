from collections import deque
from pathlib import Path
from PIL import Image

source_dir = Path('/home/ubuntu/webdev-static-assets')
sources = sorted(source_dir.glob('logstory-pixel-*-cutout.png')) + sorted(source_dir.glob('logstory-chibi-*.png'))
for source in sources:
    image = Image.open(source).convert('RGBA')
    pixels = image.load()
    width, height = image.size
    queue = deque()
    visited = bytearray(width * height)

    def is_background(r, g, b):
        # The generated backdrop includes an almost-white checker pattern and long low-saturation gray artifacts.
        return min(r, g, b) >= 108 and max(r, g, b) - min(r, g, b) <= 34

    def add(x, y):
        index = y * width + x
        if not visited[index]:
            visited[index] = 1
            queue.append((x, y))

    for x in range(width):
        add(x, 0)
        add(x, height - 1)
    for y in range(height):
        add(0, y)
        add(width - 1, y)

    while queue:
        x, y = queue.popleft()
        r, g, b, a = pixels[x, y]
        if not is_background(r, g, b):
            continue
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                add(nx, ny)

    output_name = source.name.replace('-cutout.png', '-alpha.png') if '-cutout.png' in source.name else source.name.replace('.png', '-alpha.png')
    output = source_dir / output_name
    image.save(output, 'PNG', optimize=True)
    print(output.name)
