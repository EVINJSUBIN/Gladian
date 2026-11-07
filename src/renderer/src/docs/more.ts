import type { DocModule } from '../catalog'

export const extraModules: Record<string, DocModule[]> = {
  django: [
    {
      id: 'django-request',
      title: 'Request',
      sections: [
        {
          id: 'django-request-path',
          title: 'What arrived',
          body: 'A Django view receives a request object. The path, method, and GET values are already on it. The view does not read the browser itself. It reads that object and returns a response.\n\nIf the page is blank, look at what the view returned, not at the browser first.',
          tryIt: 'Name the request value your view will read, such as a query name.'
        },
        {
          id: 'django-method',
          title: 'GET and POST',
          body: 'The same path can be opened with GET or submitted with POST. A view that only looks at GET will ignore a form body. Check request.method before you read the fields you expect.\n\nA form that "does nothing" is often a view that never looked at POST.',
          tryIt: 'Write the method your form uses on the same line as the path.'
        }
      ]
    },
    {
      id: 'django-errors',
      title: 'Errors',
      sections: [
        {
          id: 'django-404',
          title: 'Not found',
          body: 'Django answers 404 when no url pattern matches the path. A view that exists in views.py is unused until a path points at it. Compare the path you typed with the path in the url list, including a trailing slash.\n\nThe server can be running and still say the page does not exist.',
          tryIt: 'Put the typed address next to the url pattern and mark the character that differs.'
        },
        {
          id: 'django-name',
          title: 'Wrong function name',
          body: 'The url list stores a reference to a function. If the name in the list and the name of the function differ by one letter, the site fails when that path is opened. The rest of the project can still start.\n\nRead the import and the function name as a pair.',
          tryIt: 'Copy the function name from the view and paste it beside the url line before you run it.'
        }
      ]
    }
  ],
  fastapi: [
    {
      id: 'fastapi-input',
      title: 'Input',
      sections: [
        {
          id: 'fastapi-query',
          title: 'Query values',
          body: 'A FastAPI path function can take a query value by naming a parameter that is not part of the path. The caller puts it after the question mark. If the name in the function and the name in the URL differ, the value arrives empty or the call is rejected.\n\nThe function argument is the contract.',
          tryIt: 'Write the parameter name, then the URL that should supply it.'
        },
        {
          id: 'fastapi-body',
          title: 'A JSON body',
          body: 'POST data is not a query string. FastAPI reads a body when the parameter is a model or a body field. Sending form text to a JSON route, or the reverse, looks like a validation error even when the path is right.\n\nMatch the content type to the parameter you declared.',
          tryIt: 'Say whether this route reads a query or a body before you write the parameter.'
        }
      ]
    },
    {
      id: 'fastapi-errors',
      title: 'Errors',
      sections: [
        {
          id: 'fastapi-422',
          title: 'Validation failed',
          body: 'A 422 means the request reached the route and the declared types did not match. A missing field, a string where a number was required, or an extra required name are the usual causes. The path was correct. The payload was not.\n\nRead the field name in the error beside the field name in the function.',
          tryIt: 'List every required field and tick the ones the request actually sent.'
        },
        {
          id: 'fastapi-404',
          title: 'No route',
          body: 'A 404 means no path function matches. Check the prefix, the slash, and the method. A function decorated for GET will not answer POST.\n\nThe docs page in the running app lists the paths that exist. Compare your address to that list.',
          tryIt: 'Read the method and path from the decorator out loud.'
        }
      ]
    }
  ],
  pygame: [
    {
      id: 'pygame-draw',
      title: 'Drawing',
      sections: [
        {
          id: 'pygame-fill',
          title: 'Fill, then show',
          body: 'Drawing into a surface does not show up until the display is flipped or updated. A fill that never reaches the screen looks like a frozen window. The order is: handle events, draw, then update the display.\n\nIf the window stays black, the update may be missing or sitting outside the loop.',
          tryIt: 'Point at the line that updates the display and the line that fills it.'
        },
        {
          id: 'pygame-color',
          title: 'A color is three numbers',
          body: 'A color in this library is usually red, green, and blue from 0 to 255. A single name only works when you passed a mapped color. Wrong length or a value past 255 is a crash, not a tint.\n\nWrite the three numbers before you call fill.',
          tryIt: 'Pick one color as three numbers and use only that tuple.'
        }
      ]
    },
    {
      id: 'pygame-errors',
      title: 'Errors',
      sections: [
        {
          id: 'pygame-init',
          title: 'Display was not opened',
          body: 'A window exists only after the display is set. Drawing before that, or after quit, raises an error about no video mode. Init the library, set the mode, then draw.\n\nThe size you pass is the window size, not the color.',
          tryIt: 'Order the three steps on paper: init, set mode, loop.'
        },
        {
          id: 'pygame-quit',
          title: 'The window will not close',
          body: 'The loop keeps running until your code stops it. A close click is an event. If the loop never checks for quit, the window ignores the close button. Check events every pass, and break when quit arrives.\n\nA tight loop with no event check also freezes the window.',
          tryIt: 'Find the event check and say what happens on quit.'
        }
      ]
    }
  ],
  requests: [
    {
      id: 'requests-call',
      title: 'The call',
      sections: [
        {
          id: 'requests-status',
          title: 'Status before the body',
          body: 'A call can finish and still be a failure. Read the status code before you trust the body. 200 means the server accepted the request. 404 means the path is wrong. 401 means the call was not allowed.\n\nThe library does not raise for those by itself unless you ask it to.',
          tryIt: 'Write the status you expect next to the URL.'
        },
        {
          id: 'requests-timeout',
          title: 'A call can hang',
          body: 'Without a timeout, a quiet server leaves your program waiting. Pass a small timeout so a stuck host becomes an error you can read. Then you know the failure is the network, not your parser.\n\nA timeout is a number of seconds, not a retry.',
          tryIt: 'Choose a timeout in seconds before you send the call.'
        }
      ]
    },
    {
      id: 'requests-errors',
      title: 'Errors',
      sections: [
        {
          id: 'requests-connection',
          title: 'Connection refused',
          body: 'Connection refused means nothing accepted the address. The host, the port, or the server process is wrong. The URL can look tidy and still point at a closed door.\n\nCheck the scheme, host, and port as three separate pieces.',
          tryIt: 'Split the URL into scheme, host, and port and check each one.'
        },
        {
          id: 'requests-json',
          title: 'The body was not JSON',
          body: 'Calling the JSON reader on an HTML error page raises a decode error. Read the status and the first characters of the text first. A 200 page can still be HTML if you hit the wrong path.\n\nDecode only after the status is the one you expected.',
          tryIt: 'Print the status and a short slice of the text before you parse.'
        }
      ]
    }
  ],
  node: [
    {
      id: 'node-http',
      title: 'HTTP',
      sections: [
        {
          id: 'node-req',
          title: 'Request and response',
          body: 'A Node HTTP server gives you a request and a response. The request carries the URL and method. You write the status and the body on the response, then end it. If you never end the response, the browser waits.\n\nThe callback runs once per request, not once at startup.',
          tryIt: 'Mark the line that ends the response.'
        },
        {
          id: 'node-url',
          title: 'The URL is a string',
          body: 'The path arrives as a string on the request. A comparison has to match that string, including the slash. / and /home are different. Query text sits after a question mark and is not part of the path unless you parse it.\n\nBranch on the path before you write the body.',
          tryIt: 'Write the exact path string you will compare.'
        }
      ]
    },
    {
      id: 'node-errors',
      title: 'Errors',
      sections: [
        {
          id: 'node-port',
          title: 'Port in use',
          body: 'EADDRINUSE means another process already listens on that port. Your file can be correct. Pick another port or stop the other process. The error names the address, not the line of your handler.\n\nA second start of the same file causes this often.',
          tryIt: 'Read the port in the error and the port in listen as a pair.'
        },
        {
          id: 'node-module',
          title: 'Cannot find module',
          body: 'Node looks for a file or a package by the string you required or imported. A missing file, a wrong folder, or a package that was never installed all produce this. The message names the missing string.\n\nFix the string or install that package. Do not change the handler first.',
          tryIt: 'Copy the missing name from the error into your notes before you edit.'
        }
      ]
    }
  ],
  next: [
    {
      id: 'next-routes',
      title: 'Routes',
      sections: [
        {
          id: 'next-file',
          title: 'A file is a path',
          body: 'In the app router, a page file inside a folder becomes that folder\'s address. app/about/page is /about. A component file that is not page, layout, or route does not become an address by itself.\n\nRename the folder, and the address changes. The component name does not.',
          tryIt: 'Say the folder path and the browser path as the same words.'
        },
        {
          id: 'next-link',
          title: 'Links stay inside the app',
          body: 'A link component changes the page without a full reload. The href is still a path, such as /about. A normal anchor works too, and it reloads. A wrong href is a 404 even when the component renders on the page you started from.\n\nThe href and the folder have to agree.',
          tryIt: 'Write the href and the page file path on one line.'
        }
      ]
    },
    {
      id: 'next-errors',
      title: 'Errors',
      sections: [
        {
          id: 'next-404',
          title: 'Page not found',
          body: 'A 404 means no page file matches the address. Check the folder name, the file name page, and the segment you typed. A component in the wrong folder is invisible to the router.\n\nThe dev server can be running while the path is still missing.',
          tryIt: 'List the folders under app and tick the one you opened.'
        },
        {
          id: 'next-server',
          title: 'Server and browser',
          body: 'A page can run on the server, in the browser, or both. Browser-only values such as window are missing while the server renders. A crash that mentions window usually means that line ran on the server.\n\nKeep server reads and browser events in the place each one can run.',
          tryIt: 'Mark each line as server or browser before you use window.'
        }
      ]
    }
  ]
}
