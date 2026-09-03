from PIL import Image
from pathlib import Path

for path in sorted(Path('/home/ubuntu/webdev-static-assets').glob('logstory-*.png')):
    image = Image.open(path).convert('RGBA')
    corners = [image.getpixel((0, 0)), image.getpixel((image.width - 1, 0)), image.getpixel((0, image.height - 1))]
    alpha = image.getchannel('A')
    extrema = alpha.getextrema()
    print(path.name, 'size=', image.size, 'corner=', corners[0], 'alpha=', extrema)
