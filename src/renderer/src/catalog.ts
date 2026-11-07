import { flaskModules } from './docs/flask'
import { extraModules } from './docs/more'

export type StudyPage = {
  id: string
  title: string
  body: string
  tryIt: string
}

export type DocModule = {
  id: string
  title: string
  sections: StudyPage[]
}

export type PracticeCheck = {
  includes: string
  message: string
}

export type Practice = {
  title: string
  brief: string
  language: 'python' | 'html' | 'javascript'
  fileName: string
  starter: string
  checks: PracticeCheck[]
}

export type CatalogLibrary = {
  id: string
  name: string
  summary: string
  docsUrl: string
  modules?: DocModule[]
  pages: StudyPage[]
  practice: Practice
}

export function modulesOf(library: CatalogLibrary): DocModule[] {
  const base =
    library.modules && library.modules.length > 0
      ? library.modules
      : [{ id: `${library.id}-guide`, title: 'Guide', sections: library.pages }]
  const more = (extraModules[library.id] ?? []).filter((module) => !base.some((item) => item.id === module.id))
  return [...base, ...more]
}

export const CATALOG: CatalogLibrary[] = [
  {
    id: 'flask',
    name: 'Flask',
    summary: 'A small Python web library. One function can answer a browser request.',
    docsUrl: 'https://flask.palletsprojects.com/',
    modules: flaskModules,
    pages: flaskModules.flatMap((module) => module.sections),
    practice: {
      title: 'One sentence at /',
      brief: 'Make a Flask app whose / route returns a sentence you wrote. The file starts empty of that logic on purpose.',
      language: 'python',
      fileName: 'app.py',
      starter: '# A Flask app, a route for /, and a sentence you return.\n# The finished route is yours to write.\n',
      checks: [
        { includes: 'Flask(', message: 'The file still needs to create a Flask app.' },
        { includes: '@app.route', message: 'Attach a function to a path with a route.' },
        { includes: 'return ', message: 'The route needs to return the sentence.' }
      ]
    }
  },
  {
    id: 'django',
    name: 'Django',
    summary: 'A Python web framework that splits a site into settings, urls, and views.',
    docsUrl: 'https://docs.djangoproject.com/',
    pages: [
      {
        id: 'django-view',
        title: 'A view answers a request',
        body: 'In Django a view is a function that receives the request and returns a response. The url file decides which path calls which view. The view does not guess the address. The url list tells it.',
        tryIt: 'Name one path and the view function that should answer it.'
      },
      {
        id: 'django-url',
        title: 'The path lives in the url list',
        body: 'A view that is never listed in urls.py will not run. The list pairs a path with a function. When you add a page, you add both: the function, and the line that points at it.',
        tryIt: 'Trace one path from the url list to the function name.'
      },
      {
        id: 'django-mistake',
        title: 'A common miss',
        body: 'Creating the view and forgetting the url line is the usual first gap. The server starts, and the path still answers with not found. The function can be correct and unused.',
        tryIt: 'Check that the function name in the url list is the function you wrote.'
      }
    ],
    practice: {
      title: 'A view that says hello',
      brief: 'Write a view function that returns an HttpResponse with your own greeting. Then imagine the url line that would call it.',
      language: 'python',
      fileName: 'views.py',
      starter: '# Return an HttpResponse from a view named home.\n# The greeting inside it is yours.\n',
      checks: [
        { includes: 'HttpResponse(', message: 'The view needs to return an HttpResponse.' },
        { includes: 'def home', message: 'Name the view home so the url list has something to call.' }
      ]
    }
  },
  {
    id: 'fastapi',
    name: 'FastAPI',
    summary: 'A Python API library. A function can answer a path with data.',
    docsUrl: 'https://fastapi.tiangolo.com/',
    pages: [
      {
        id: 'fastapi-path',
        title: 'A path operation',
        body: 'FastAPI maps an HTTP method and a path to a function. GET / is a common first path. The function returns a dictionary, and FastAPI turns that dictionary into JSON.',
        tryIt: 'Decide the one field your dictionary will have, and the word that belongs in it.'
      },
      {
        id: 'fastapi-app',
        title: 'The app holds the paths',
        body: 'You create one FastAPI app, then decorate functions with the method and the path. The decorator is what publishes the function. A plain function in the file is not yet an endpoint.',
        tryIt: 'Read a decorator from left to right: method, path, then the function under it.'
      },
      {
        id: 'fastapi-mistake',
        title: 'A common miss',
        body: 'Returning a string when you meant to return data still works, but it is a different response. A dictionary tells the caller they received data. Match the return to what the page promised.',
        tryIt: 'Write the dictionary on paper with one key and one value before you type it.'
      }
    ],
    practice: {
      title: 'GET / returns your name',
      brief: 'Create a FastAPI app and a GET / that returns a dictionary containing your name.',
      language: 'python',
      fileName: 'main.py',
      starter: '# A FastAPI app and a GET / that returns a dictionary.\n# Put your own name in the value.\n',
      checks: [
        { includes: 'FastAPI', message: 'The file still needs to create a FastAPI app.' },
        { includes: '@app.get', message: 'Publish a GET path on the app.' },
        { includes: 'return {', message: 'Return a dictionary, not a finished example copied from elsewhere.' }
      ]
    }
  },
  {
    id: 'pygame',
    name: 'Pygame',
    summary: 'A Python game library. A window, a color, and a loop.',
    docsUrl: 'https://www.pygame.org/docs/',
    pages: [
      {
        id: 'pygame-window',
        title: 'A window is a surface',
        body: 'set_mode asks for a window of a width and a height. The object you get back is the surface you draw on. Nothing appears until you draw and then flip the display.',
        tryIt: 'Pick a width, a height, and one color before you open the window.'
      },
      {
        id: 'pygame-loop',
        title: 'The loop keeps the window alive',
        body: 'A game looks at events, draws, and flips, then does it again. The QUIT event is how the person closes the window. Without that check, the window does not know how to leave.',
        tryIt: 'Say the three beats: events, draw, flip.'
      },
      {
        id: 'pygame-mistake',
        title: 'A common miss',
        body: 'Filling the surface and forgetting to flip leaves the window blank. The fill changed the hidden surface. flip is what copies it onto the screen.',
        tryIt: 'After you decide the color, name the line that will show it.'
      }
    ],
    practice: {
      title: 'A window in one color',
      brief: 'Open a window, fill it with a color you choose, and flip the display. Running stops after a few seconds so a loop cannot hold the app.',
      language: 'python',
      fileName: 'game.py',
      starter: '# Init pygame, open a window, fill one color, flip.\n# Leave the loop so the window can close.\n',
      checks: [
        { includes: 'set_mode', message: 'Open a window with set_mode.' },
        { includes: '.fill(', message: 'Fill the window with a color.' },
        { includes: 'flip', message: 'Flip the display so the color can show.' }
      ]
    }
  },
  {
    id: 'requests',
    name: 'Requests',
    summary: 'A Python library for calling an HTTPS API. The guide is local. The call needs the network.',
    docsUrl: 'https://requests.readthedocs.io/',
    pages: [
      {
        id: 'requests-get',
        title: 'GET asks for a page',
        body: 'requests.get sends a GET to an https address and returns the response. The status code is the server’s short answer. 200 means it answered. 401 or 403 means the call needs permission.',
        tryIt: 'Choose a public https address you are allowed to call. Do not put a secret in the file.'
      },
      {
        id: 'requests-body',
        title: 'The body is text until you parse it',
        body: 'response.text is the body as text. response.json() parses JSON when the server actually sent JSON. Read the status before you trust the body.',
        tryIt: 'Decide whether you will print the status, a short slice of the text, or both.'
      },
      {
        id: 'requests-mistake',
        title: 'A common miss',
        body: 'A key pasted into the file will be copied with the project. Headers belong in the call only after the docs name the header. Until then, a public URL and the status code are enough.',
        tryIt: 'Search your file for a password or a token before you save it.'
      }
    ],
    practice: {
      title: 'Print one status code',
      brief: 'Call requests.get with an https URL you are allowed to use. Print the status code. Leave secrets out of the file.',
      language: 'python',
      fileName: 'call.py',
      starter: '# Call requests.get with an https URL you are allowed to use.\n# Print the status code. Do not put a secret in this file.\n',
      checks: [
        { includes: 'requests.get', message: 'The script needs a requests.get call.' },
        { includes: 'status_code', message: 'Print the status code from the response.' },
        { includes: 'https://', message: 'Use an https address.' }
      ]
    }
  },
  {
    id: 'node',
    name: 'Node.js',
    summary: 'JavaScript on the server. A small HTTP server can answer one path.',
    docsUrl: 'https://nodejs.org/api/http.html',
    pages: [
      {
        id: 'node-server',
        title: 'The server is a function',
        body: 'The http module can create a server from a function. Each request calls that function with the request and the response. You write the status and the body on the response, then end it.',
        tryIt: 'Choose the status number and the one sentence the body will be.'
      },
      {
        id: 'node-listen',
        title: 'Listen opens the port',
        body: 'Creating the server does not publish it. listen takes a port. Until listen runs, nothing can connect. The port number is part of the address you open in the browser.',
        tryIt: 'Pick a port and say the local address that would use it.'
      },
      {
        id: 'node-mistake',
        title: 'A common miss',
        body: 'Writing the body and forgetting to end the response leaves the browser waiting. end tells the client the message is finished.',
        tryIt: 'Find the line that finishes the response before you run anything.'
      }
    ],
    practice: {
      title: 'Answer with one sentence',
      brief: 'Create an HTTP server that responds with a sentence you wrote, then listen on a port.',
      language: 'javascript',
      fileName: 'server.js',
      starter: '// Create an http server, write a sentence you chose, end the response, and listen.\n',
      checks: [
        { includes: 'createServer', message: 'Create a server with createServer.' },
        { includes: '.end', message: 'End the response after the sentence.' },
        { includes: '.listen', message: 'Listen on a port so the server can be reached.' }
      ]
    }
  },
  {
    id: 'next',
    name: 'Next.js',
    summary: 'A React framework. A page file is a route, and the component is what the route shows.',
    docsUrl: 'https://nextjs.org/docs',
    pages: [
      {
        id: 'next-page',
        title: 'A file can be a route',
        body: 'In the app router, a page file exports a component, and that file’s folder is the route. The component’s return value is what the route shows. The file name page is the convention that makes the route exist.',
        tryIt: 'Pick the heading the route should show before you write the component.'
      },
      {
        id: 'next-component',
        title: 'The component returns the page',
        body: 'A page component returns elements. A heading is enough for a first route. The text inside it is the part that has to be yours. The surrounding function only delivers it.',
        tryIt: 'Write the heading words down, then make them the only text in the return.'
      },
      {
        id: 'next-mistake',
        title: 'A common miss',
        body: 'A component that is not exported as the default does not become the route. The file can look finished and the address still has nothing to render.',
        tryIt: 'Check that the page file exports the component you meant to show.'
      }
    ],
    practice: {
      title: 'A page with your heading',
      brief: 'Export a page component whose heading is a title you wrote.',
      language: 'javascript',
      fileName: 'page.js',
      starter: '// Export a page component.\n// The heading text has to be yours.\n',
      checks: [
        { includes: 'export default', message: 'Export the page component as the default.' },
        { includes: '<h1', message: 'Return a heading for the route.' }
      ]
    }
  }
]
