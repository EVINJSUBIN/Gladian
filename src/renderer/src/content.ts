export type Article = {
  id: string
  title: string
  body: string
  tryIt: string
}

export const ARTICLES: Article[] = [
  {
    id: 'html-document',
    title: 'An HTML document',
    body: 'A page starts with a doctype, then html, head, and body. The head holds the title and the style. The body holds what people see.\n\nTags come in pairs. The opening tag names the element. The closing tag repeats the name with a slash.',
    tryIt: 'Make sure your file has html, head, and body. Put the visible words in the body.'
  },
  {
    id: 'html-text',
    title: 'Headings and paragraphs',
    body: 'h1 is the title of the page. Use one. p is a paragraph of ordinary text.\n\nExample shape:\n<h1>Your name</h1>\n<p>A sentence about you.</p>\n\nThe words between the tags are yours.',
    tryIt: 'Add one heading and one paragraph. Read them out loud. If they make sense, the tags are doing their job.'
  },
  {
    id: 'html-links',
    title: 'Links',
    body: 'An anchor tag jumps somewhere. href is the address. The text between the tags is what people click.\n\n<a href="https://example.com">Example</a>\n\nIf the address is missing, the link has nowhere to go.',
    tryIt: 'Add one link whose text says where it goes, not just "click here".'
  },
  {
    id: 'html-images',
    title: 'Images',
    body: 'img points at a picture with src. alt is the words that stand in when the picture cannot be seen.\n\n<img src="cat.jpg" alt="A cat asleep on a chair">\n\nAn empty alt is only right when the picture is pure decoration.',
    tryIt: 'If you add an image, write an alt that describes it.'
  },
  {
    id: 'html-buttons',
    title: 'Buttons',
    body: 'A button is for an action on the page. Give it an id when your script needs to find it.\n\n<button id="roll" type="button">Roll</button>\n\ntype="button" keeps it from trying to submit a form.',
    tryIt: 'Add a button with a clear label. Leave the behavior to the script.'
  },
  {
    id: 'html-forms',
    title: 'Inputs',
    body: 'input collects text. id lets the script find it. The person using the page needs a label they can see, not only a placeholder.\n\n<label for="task">Task</label>\n<input id="task" type="text" />',
    tryIt: 'Add an input and a label that says what to type.'
  },
  {
    id: 'css-selectors',
    title: 'Selectors',
    body: 'A style rule picks elements, then sets properties.\n\nbody { color: #f6f1e7; }\n\nbody selects the whole page. #roll selects the element whose id is roll. .card selects every element with class card.',
    tryIt: 'Write one rule that changes the color of the body or the heading.'
  },
  {
    id: 'css-box',
    title: 'The box',
    body: 'Every element is a box. padding is space inside the border. margin is space outside it.\n\nbody {\n  padding: 24px;\n}\n\nSpace makes the words easier to read.',
    tryIt: 'Add padding to the body so the text is not stuck to the edge.'
  },
  {
    id: 'css-color',
    title: 'Color',
    body: 'background sets the surface. color sets the text. They need to be different enough to read.\n\nbody {\n  background: #1a1814;\n  color: #f6f1e7;\n}\n\nA name like tomato also works. A hex code is more exact.',
    tryIt: 'Set a background and a text color. Look at the preview and change them if the words are hard to see.'
  },
  {
    id: 'css-flex',
    title: 'Flex',
    body: 'display: flex lays children in a row. gap is the space between them. flex-direction: column stacks them.\n\nbody {\n  display: flex;\n  gap: 12px;\n}',
    tryIt: 'Put the button and the result in a row or a column with a gap.'
  },
  {
    id: 'js-values',
    title: 'Values and names',
    body: 'let and const give a value a name. let can change later. const cannot be reassigned.\n\nlet tasks = []\nconst sides = 6\n\nvar still works in old code. Prefer let or const so the lifetime of the name is clear.',
    tryIt: 'Name one value you need. Use let if it will change, const if it will not.'
  },
  {
    id: 'js-conditions',
    title: 'Conditions',
    body: 'if runs a block only when the test is true.\n\nif (tasks.length === 0) {\n  // nothing to show yet\n}\n\n=== checks the value and the type. = assigns. Mixing them up is a common slip.',
    tryIt: 'Write one if that checks something already in your file.'
  },
  {
    id: 'js-functions',
    title: 'Functions',
    body: 'A function packages steps you can run by name.\n\nfunction rollDie() {\n  return Math.floor(Math.random() * 6) + 1\n}\n\nMath.random() is from 0 up to but not including 1. Multiply, floor, then add 1 to land on 1 through 6. return sends the number back to the caller.',
    tryIt: 'Write the function yourself. Call it from the console or from a click and see which number comes back.'
  },
  {
    id: 'js-arrays',
    title: 'Arrays',
    body: 'An array holds a list in order.\n\nlet tasks = []\ntasks.push("milk")\n\nThe first item is at index 0. length tells you how many items are stored. A loop or forEach walks them.',
    tryIt: 'Create an array and push one item into it when something is clicked.'
  },
  {
    id: 'js-dom',
    title: 'Finding elements',
    body: 'The document is the live page. querySelector finds the first match. getElementById finds an id.\n\nconst list = document.querySelector("#list")\nconst item = document.createElement("li")\nitem.textContent = "milk"\nlist.append(item)\n\ntextContent is text. innerHTML reads as HTML, so prefer textContent for words the person typed.',
    tryIt: 'Find one element by its id and change its text.'
  },
  {
    id: 'js-events',
    title: 'Clicks',
    body: 'addEventListener runs your function when something happens.\n\nconst button = document.querySelector("#roll")\nbutton.addEventListener("click", () => {\n  const roll = rollDie()\n  document.querySelector("#result").textContent = String(roll)\n})\n\nThe page waits. Your function runs on the click.',
    tryIt: 'Listen for click on a button that already has an id. Update one other element inside the listener.'
  }
]

export const UNLOCKS = [
  { id: 'format', xp: 50, label: 'Format document' },
  { id: 'find', xp: 120, label: 'Find in the open file' },
  { id: 'problems', xp: 220, label: 'Problems list' },
  { id: 'search', xp: 360, label: 'Find across the project' },
  { id: 'split', xp: 520, label: 'Split editor' },
  { id: 'terminal', xp: 720, label: 'Terminal' }
] as const

export type UnlockId = (typeof UNLOCKS)[number]['id']

export function unlocked(xp: number, id: UnlockId) {
  return xp >= UNLOCKS.find((item) => item.id === id)!.xp
}

export function nextUnlock(xp: number) {
  return UNLOCKS.find((item) => item.xp > xp) ?? null
}
