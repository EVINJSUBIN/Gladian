import { flaskModules } from './docs/flask'
import { djangoModules } from './docs/django'
import { fastapiModules } from './docs/fastapi'
import { pygameModules } from './docs/pygame'
import { requestsModules } from './docs/requests'
import { nodeModules } from './docs/node'
import { nextjsModules } from './docs/nextjs'
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
      starter: '# A Flask app, a route for /, and a sentence you return.\n# The finished route is yours to write.\nfrom flask import Flask\n\napp = Flask(__name__)\n\n# Write your route below\n',
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
    modules: djangoModules,
    pages: djangoModules.flatMap((module) => module.sections),
    practice: {
      title: 'A view that says hello',
      brief: 'Write a view function that returns an HttpResponse with your own greeting. Then imagine the url line that would call it.',
      language: 'python',
      fileName: 'views.py',
      starter: 'from django.http import HttpResponse\n\n# Write a view named home that returns an HttpResponse.\n# The greeting inside it is yours.\n',
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
    modules: fastapiModules,
    pages: fastapiModules.flatMap((module) => module.sections),
    practice: {
      title: 'GET / returns your name',
      brief: 'Create a FastAPI app and a GET / that returns a dictionary containing your name.',
      language: 'python',
      fileName: 'main.py',
      starter: 'from fastapi import FastAPI\n\napp = FastAPI()\n\n# Write a GET / that returns a dictionary with your name\n',
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
    modules: pygameModules,
    pages: pygameModules.flatMap((module) => module.sections),
    practice: {
      title: 'A window in one color',
      brief: 'Open a window, fill it with a color you choose, run the event loop so the window stays open, and close cleanly on QUIT.',
      language: 'python',
      fileName: 'game.py',
      starter: 'import pygame\npygame.init()\n\n# Open a 640x480 window, fill it with a color, and run the event loop.\n# Press the X button to close.\n',
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
    modules: requestsModules,
    pages: requestsModules.flatMap((module) => module.sections),
    practice: {
      title: 'Print one status code',
      brief: 'Call requests.get with an https URL you are allowed to use. Print the status code. Leave secrets out of the file.',
      language: 'python',
      fileName: 'call.py',
      starter: 'import requests\n\n# Call requests.get with an https URL you are allowed to use.\n# Print the status code. Do not put a secret in this file.\n',
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
    modules: nodeModules,
    pages: nodeModules.flatMap((module) => module.sections),
    practice: {
      title: 'Answer with one sentence',
      brief: 'Create an HTTP server that responds with a sentence you wrote, then listen on port 3000.',
      language: 'javascript',
      fileName: 'server.js',
      starter: 'const http = require(\'http\')\n\n// Create an http server, write a sentence you chose, end the response.\n// Then call server.listen(3000).\n',
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
    modules: nextjsModules,
    pages: nextjsModules.flatMap((module) => module.sections),
    practice: {
      title: 'A page with your heading',
      brief: 'Export a default page component from app/page.js whose heading contains text you wrote.',
      language: 'javascript',
      fileName: 'page.js',
      starter: '// Export a default page component.\n// Return a <main> with an <h1> whose text is yours.\n',
      checks: [
        { includes: 'export default', message: 'Export the page component as the default.' },
        { includes: '<h1', message: 'Return a heading for the route.' }
      ]
    }
  }
]
