import type { DocModule } from '../catalog'

export const flaskModules: DocModule[] = [
  {
    id: 'flask-start',
    title: 'Start',
    sections: [
      {
        id: 'flask-app',
        title: 'The app object',
        body: 'A Flask program starts by creating one app. That object is the place routes are attached. Import Flask, then call it with the module name, usually __name__.\n\nUntil that object exists, a function in the file is only a function. Nothing is published to a browser.',
        tryIt: 'Create the app on its own line and read the name you gave it.'
      },
      {
        id: 'flask-first-route',
        title: 'The first route',
        body: 'A route connects a path, such as /, to a function. The decorator sits on the line above the function and names the path. The function returns the text the browser should show.\n\nThe path in the decorator and the path in the address bar have to be the same, including the slash.',
        tryIt: 'Pick the sentence your / path will return before you write the function.'
      },
      {
        id: 'flask-run',
        title: 'Running it',
        body: 'The file does nothing until the app runs. From the folder that contains the file, start it with the app name Flask printed in its own help, usually flask --app app run. The terminal then prints a local address.\n\nIf you change the return text, save, and start again, the page changes. That loop is the whole practice.',
        tryIt: 'Read the local address in the terminal and open that exact address.'
      }
    ]
  },
  {
    id: 'flask-routing',
    title: 'Routing',
    sections: [
      {
        id: 'flask-methods',
        title: 'Path and method',
        body: 'A path can allow one HTTP method or several. GET reads. POST sends a form. If the decorator does not list POST, a form submit to that path is rejected even when the function looks finished.\n\nSay the method and the path together: GET / is not the same door as POST /.',
        tryIt: 'Write down the method your page needs before you add the route.'
      },
      {
        id: 'flask-variables',
        title: 'A name in the path',
        body: 'A path can carry a piece of the address into the function, such as /hello/<name>. The function must take an argument with that same name. The value is whatever was in the address, not a value you hard-code.\n\nIf the argument name and the path name differ, Flask cannot call the function.',
        tryIt: 'Choose the path name and the argument name so they match letter for letter.'
      },
      {
        id: 'flask-order',
        title: 'Which route matches',
        body: 'Flask picks the route whose pattern fits the address. A fixed path and a variable path can both look possible. The more specific path should be the one you meant. A missing trailing slash is a different address from the one with the slash.',
        tryIt: 'Compare the address you typed with the string inside the decorator.'
      }
    ]
  },
  {
    id: 'flask-request',
    title: 'Request',
    sections: [
      {
        id: 'flask-request-object',
        title: 'The request object',
        body: 'While a route runs, request holds what the browser sent: the method, the path, and the values. You import request from Flask. It is only meaningful inside a request. Reading it at import time does not see a browser.',
        tryIt: 'Inside the route, print request.method and see if it matches the method you expected.'
      },
      {
        id: 'flask-args',
        title: 'Query arguments',
        body: 'Values after ? in the address are query arguments. request.args.get("q") reads one of them. If the name is absent, get returns None unless you pass a default. The page should still make sense when the argument is missing.',
        tryIt: 'Open the path once with the argument and once without it.'
      },
      {
        id: 'flask-form',
        title: 'Form fields',
        body: 'A submitted form arrives in request.form when the route allows POST and the form field name matches the key you read. An input named "title" is request.form.get("title"). A different name reads nothing, and the route looks empty.',
        tryIt: 'Match the input name in the form to the key you read in the route.'
      }
    ]
  },
  {
    id: 'flask-response',
    title: 'Response',
    sections: [
      {
        id: 'flask-return',
        title: 'What return means',
        body: 'The value you return becomes the response. A string is a page of text. A dictionary can be sent as JSON. The browser does not see the function name. It sees that return value.\n\nIf you forget to return, the response is empty even though the function ran.',
        tryIt: 'Make the return value the only sentence on the page, then read it in the browser.'
      },
      {
        id: 'flask-status',
        title: 'Status and headers',
        body: 'You can return a body and a status number together, such as a message and 404. The status tells the client what kind of answer this is. 200 means the page is there. 404 means this path has no page.\n\nHeaders are extra notes, such as the content type. Change one only when you know the name the client expects.',
        tryIt: 'Decide whether this route should say 200 or 404 before you return.'
      },
      {
        id: 'flask-redirect',
        title: 'Redirect',
        body: 'redirect sends the browser to another path instead of rendering this one. The route returns that redirect. The path you send them to still needs its own route, or they arrive at a missing page.',
        tryIt: 'Name the path you are leaving and the path you are sending them to.'
      }
    ]
  },
  {
    id: 'flask-templates',
    title: 'Templates',
    sections: [
      {
        id: 'flask-render',
        title: 'Rendering a template',
        body: 'render_template looks for an HTML file in a templates folder next to the app. The route returns the result. The HTML file is the page. The route only chooses which file and which values to pass in.\n\nIf the file is in the wrong folder, Flask reports that the template was not found. The route can be correct and the folder wrong.',
        tryIt: 'Put one HTML file in templates and return it from one route.'
      },
      {
        id: 'flask-values',
        title: 'Values in the page',
        body: 'Names you pass into render_template can be printed in the template. The words that matter are still yours. The template is the place the sentence sits, not a reason to hide the sentence in Python.\n\nIf a name in the template was not passed in, that spot renders empty.',
        tryIt: 'Pass one name from the route and show it in the heading.'
      }
    ]
  },
  {
    id: 'flask-errors',
    title: 'Errors',
    sections: [
      {
        id: 'flask-404',
        title: 'A missing path',
        body: 'A 404 means no route matched the address. The usual cause is a different slash, a different spelling, or a function that was never given a route. The server can be running the whole time.\n\nRead the path in the error and the path in the decorator side by side.',
        tryIt: 'Copy the path from the browser into the decorator, or the other way around, until they match.'
      },
      {
        id: 'flask-abort',
        title: 'Stopping with abort',
        body: 'abort(404) inside a route ends the request with that status. Use it when the path exists but the thing it asked for does not, such as an id that is not in your data. It is different from having no route at all.',
        tryIt: 'Decide which missing things should be 404 even though the route itself exists.'
      },
      {
        id: 'flask-handler',
        title: 'Your own error page',
        body: 'An error handler is a function for one status code. It returns the page people see when that status happens. Keep the message short and say what to try next. The handler does not fix the missing route. It only explains it.',
        tryIt: 'Write one sentence a person should read when the path is wrong.'
      }
    ]
  }
]
