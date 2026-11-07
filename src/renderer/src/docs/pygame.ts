import type { DocModule } from '../catalog'

export const pygameModules: DocModule[] = [
  {
    id: 'pygame-setup',
    title: 'Setup & Install',
    sections: [
      {
        id: 'pygame-install',
        title: 'Installing Pygame',
        body: `Pygame is a Python library for making games. Install it with pip, then import it in your file.\n\n\`\`\`bash\npip install pygame\n\`\`\`\n\nOnce installed, start every Pygame program with:\n\n\`\`\`python\nimport pygame\npygame.init()\n\`\`\`\n\npygame.init() starts all the Pygame subsystems (display, sound, input). Call it before anything else.`,
        tryIt: 'Open a terminal, run pip install pygame, then write import pygame; pygame.init() and confirm it does not error.'
      },
      {
        id: 'pygame-window',
        title: 'Opening a Window',
        body: `A Pygame window is created with set_mode. You give it a tuple of (width, height).\n\n\`\`\`python\nimport pygame\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\npygame.display.set_caption("My Game")\n\`\`\`\n\nset_mode returns a Surface — the canvas you draw on. set_caption sets the title bar text.\n\nThe window does not appear until you enter the game loop.`,
        tryIt: 'Pick a width and height for your window. Write set_mode with those values and give the window a title.'
      }
    ]
  },
  {
    id: 'pygame-loop',
    title: 'The Game Loop',
    sections: [
      {
        id: 'pygame-event-loop',
        title: 'The Event Loop',
        body: `Every Pygame game runs in a loop. The loop does three things every frame: check events, draw, and flip.\n\n\`\`\`python\nimport pygame\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\nclock = pygame.time.Clock()\nrunning = True\n\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n\n    screen.fill((30, 30, 30))   # dark background\n    pygame.display.flip()        # show what we drew\n    clock.tick(60)               # limit to 60 fps\n\npygame.quit()\n\`\`\`\n\npygame.QUIT fires when the user closes the window. Without it, the window never closes.`,
        tryIt: 'Copy this loop and run it. Try changing the fill color RGB values to see a different background.'
      },
      {
        id: 'pygame-clock',
        title: 'Controlling Frame Rate',
        body: `The Clock object controls how fast the loop runs.\n\n\`\`\`python\nclock = pygame.time.Clock()\n\nwhile running:\n    # ... events and drawing ...\n    clock.tick(60)  # max 60 frames per second\n\`\`\`\n\nclock.tick(fps) pauses the loop if the frame took less time than 1/fps seconds. This prevents the game from running at thousands of frames per second and eating CPU.`,
        tryIt: 'Change the tick value to 30 and to 10. Notice how the game feels slower at 10 fps.'
      }
    ]
  },
  {
    id: 'pygame-drawing',
    title: 'Drawing Shapes',
    sections: [
      {
        id: 'pygame-colors',
        title: 'Colors',
        body: `Pygame colors are RGB tuples: (red, green, blue), each 0–255.\n\n\`\`\`python\nWHITE  = (255, 255, 255)\nBLACK  = (0, 0, 0)\nRED    = (220, 50, 50)\nGREEN  = (50, 200, 80)\nBLUE   = (50, 100, 220)\n\nscreen.fill(BLACK)  # fill the whole surface black\n\`\`\`\n\nCommon colors to memorize: (255,0,0) is pure red, (0,255,0) is pure green, (0,0,255) is pure blue.`,
        tryIt: 'Pick a color you like, write its RGB values, and use it as the fill color.'
      },
      {
        id: 'pygame-rect',
        title: 'Drawing Rectangles',
        body: `pygame.draw.rect draws a filled or outlined rectangle.\n\n\`\`\`python\nimport pygame\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\nclock = pygame.time.Clock()\nrunning = True\n\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n\n    screen.fill((0, 0, 0))\n\n    # draw.rect(surface, color, (x, y, width, height))\n    pygame.draw.rect(screen, (220, 50, 50), (100, 150, 200, 100))\n\n    # border_radius makes rounded corners\n    pygame.draw.rect(screen, (50, 150, 220), (350, 150, 200, 100), border_radius=12)\n\n    pygame.display.flip()\n    clock.tick(60)\n\npygame.quit()\n\`\`\`\n\nThe rect tuple is (x, y, width, height). x=0, y=0 is the top-left corner.`,
        tryIt: 'Draw two rectangles of different colors at different positions on the screen.'
      },
      {
        id: 'pygame-circle',
        title: 'Drawing Circles',
        body: `pygame.draw.circle draws a circle from its center point.\n\n\`\`\`python\n# draw.circle(surface, color, center, radius)\npygame.draw.circle(screen, (255, 200, 0), (400, 300), 60)\n\n# width=3 gives an outline instead of a fill\npygame.draw.circle(screen, (255, 255, 255), (400, 300), 60, width=3)\n\`\`\`\n\nThe center is an (x, y) tuple in pixel coordinates. Radius is in pixels.`,
        tryIt: 'Draw a filled circle in the center of the screen. Then draw a smaller white circle on top of it.'
      },
      {
        id: 'pygame-line',
        title: 'Drawing Lines',
        body: `pygame.draw.line draws a straight line between two points.\n\n\`\`\`python\n# draw.line(surface, color, start_pos, end_pos, width)\npygame.draw.line(screen, (255, 255, 255), (0, 0), (800, 600), 2)\npygame.draw.line(screen, (255, 0, 0), (0, 600), (800, 0), 2)\n\`\`\`\n\nThis draws an X across the whole window. width is the line thickness in pixels.`,
        tryIt: 'Draw a cross (+ shape) through the center of the screen using two lines.'
      }
    ]
  },
  {
    id: 'pygame-events',
    title: 'Events & Input',
    sections: [
      {
        id: 'pygame-keyboard',
        title: 'Keyboard Input',
        body: `Check which keys are pressed with pygame.key.get_pressed().\n\n\`\`\`python\nx = 400\ny = 300\nspeed = 5\n\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n\n    keys = pygame.key.get_pressed()\n    if keys[pygame.K_LEFT]:  x -= speed\n    if keys[pygame.K_RIGHT]: x += speed\n    if keys[pygame.K_UP]:    y -= speed\n    if keys[pygame.K_DOWN]:  y += speed\n\n    screen.fill((0, 0, 0))\n    pygame.draw.circle(screen, (220, 80, 50), (x, y), 20)\n    pygame.display.flip()\n    clock.tick(60)\n\`\`\`\n\nCommon key constants: K_LEFT, K_RIGHT, K_UP, K_DOWN, K_SPACE, K_ESCAPE, K_w, K_a, K_s, K_d.`,
        tryIt: 'Create a circle that moves with the arrow keys. Clamp x and y so it cannot leave the window.'
      },
      {
        id: 'pygame-mouse',
        title: 'Mouse Input',
        body: `Get mouse position and button state:\n\n\`\`\`python\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n        if event.type == pygame.MOUSEBUTTONDOWN:\n            print("Clicked at", event.pos)\n\n    mx, my = pygame.mouse.get_pos()\n    pressed = pygame.mouse.get_pressed()  # (left, middle, right)\n\n    screen.fill((0, 0, 0))\n    # draw circle at mouse position\n    pygame.draw.circle(screen, (100, 200, 100), (mx, my), 15)\n    pygame.display.flip()\n    clock.tick(60)\n\`\`\`\n\nMOUSEBUTTONDOWN fires once per click. get_pressed()[0] is True while left button is held.`,
        tryIt: 'Make a circle follow the mouse cursor. When the left button is held, change the circle color.'
      }
    ]
  },
  {
    id: 'pygame-sprites',
    title: 'Sprites & Groups',
    sections: [
      {
        id: 'pygame-sprite-class',
        title: 'The Sprite Class',
        body: `A Sprite is a game object with an image and a rect. Groups manage and draw many sprites at once.\n\n\`\`\`python\nimport pygame\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\nclock = pygame.time.Clock()\n\nclass Ball(pygame.sprite.Sprite):\n    def __init__(self):\n        super().__init__()\n        self.image = pygame.Surface((40, 40), pygame.SRCALPHA)\n        pygame.draw.circle(self.image, (220, 80, 50), (20, 20), 20)\n        self.rect = self.image.get_rect(center=(400, 300))\n        self.vx = 4\n        self.vy = 3\n\n    def update(self):\n        self.rect.x += self.vx\n        self.rect.y += self.vy\n        if self.rect.left < 0 or self.rect.right > 800:\n            self.vx *= -1\n        if self.rect.top < 0 or self.rect.bottom > 600:\n            self.vy *= -1\n\nball = Ball()\nall_sprites = pygame.sprite.Group(ball)\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    all_sprites.update()\n    screen.fill((20, 20, 30))\n    all_sprites.draw(screen)\n    pygame.display.flip()\n    clock.tick(60)\n\npygame.quit()\n\`\`\`\n\nall_sprites.update() calls update() on every sprite. all_sprites.draw(screen) blits each sprite's image at its rect position.`,
        tryIt: 'Modify the Ball so it speeds up slightly every time it bounces off a wall.'
      }
    ]
  },
  {
    id: 'pygame-text',
    title: 'Text & Fonts',
    sections: [
      {
        id: 'pygame-font',
        title: 'Rendering Text',
        body: `Pygame renders text as a Surface using a Font object.\n\n\`\`\`python\nimport pygame\npygame.init()\n\nscreen = pygame.display.set_mode((800, 600))\nclock = pygame.time.Clock()\n\nfont = pygame.font.SysFont("Arial", 36)\nscore = 0\n\nrunning = True\nwhile running:\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n        if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:\n            score += 1\n\n    screen.fill((0, 0, 0))\n\n    text_surface = font.render(f"Score: {score}", True, (255, 255, 255))\n    screen.blit(text_surface, (20, 20))\n\n    pygame.display.flip()\n    clock.tick(60)\n\npygame.quit()\n\`\`\`\n\nfont.render(text, antialias, color) returns a Surface. screen.blit(surface, pos) draws it at position (x, y).`,
        tryIt: 'Display a score counter that increases every time the spacebar is pressed.'
      }
    ]
  }
]
