import type { DocModule } from '../catalog'

export const djangoModules: DocModule[] = [
  {
    id: 'django-setup',
    title: 'Setup & Project Creation',
    sections: [
      {
        id: 'django-install',
        title: 'Install Django',
        body: `Install Django using pip inside a virtual environment:\n\n\`\`\`bash\npip install django\n\`\`\`\n\nCheck the installed version:\n\n\`\`\`bash\npython -m django --version\n\`\`\`\n\nDjango versions matter. 4.x and 5.x are both in common use. The commands and patterns in this guide work for both.`,
        tryIt: 'Install Django in a fresh virtual environment and print the version number.'
      },
      {
        id: 'django-startproject',
        title: 'Create a project',
        body: `The \`django-admin\` command creates a new project skeleton:\n\n\`\`\`bash\ndjango-admin startproject mysite\n\`\`\`\n\nThis creates a folder called \`mysite\` with this structure:\n\n\`\`\`text\nmysite/\n  manage.py          # your command-line tool\n  mysite/\n    __init__.py\n    settings.py      # project configuration\n    urls.py          # the top-level URL table\n    wsgi.py          # production server entry point\n    asgi.py          # async server entry point\n\`\`\`\n\nThe outer \`mysite/\` is your working directory. The inner \`mysite/\` is the Python package.`,
        tryIt: 'Create a project, cd into it, and list its files to understand the structure.'
      },
      {
        id: 'django-startapp',
        title: 'Create an app inside the project',
        body: `A Django project is split into apps. Create one with \`manage.py\`:\n\n\`\`\`bash\ncd mysite\npython manage.py startapp blog\n\`\`\`\n\nThis creates:\n\n\`\`\`text\nblog/\n  __init__.py\n  admin.py\n  apps.py\n  models.py     # database tables\n  tests.py\n  views.py      # your view functions\n  migrations/\n\`\`\`\n\nThen register the app in \`settings.py\`:\n\n\`\`\`python\nINSTALLED_APPS = [\n    "blog",           # add this line\n    "django.contrib.admin",\n    # ...\n]\n\`\`\``,
        tryIt: 'Create a blog app, add it to INSTALLED_APPS, and confirm the server still starts.'
      },
      {
        id: 'django-runserver',
        title: 'Start the development server',
        body: `The Django development server reloads on file changes:\n\n\`\`\`bash\npython manage.py runserver\n\n# Custom port:\npython manage.py runserver 8080\n\n# Accessible from other devices on the network:\npython manage.py runserver 0.0.0.0:8000\n\`\`\`\n\nVisit \`http://127.0.0.1:8000\`. You should see the Django welcome page. The server is for development only — it handles one request at a time.`,
        tryIt: 'Start the server and open the welcome page. Then change the port to 9000 and open that.'
      }
    ]
  },
  {
    id: 'django-views',
    title: 'Views & URLs',
    sections: [
      {
        id: 'django-view-function',
        title: 'Writing a view function',
        body: `A view is a Python function in \`views.py\` that takes a request and returns a response:\n\n\`\`\`python\n# blog/views.py\nfrom django.http import HttpResponse\n\ndef index(request):\n    return HttpResponse("Hello from the blog index!")\n\ndef detail(request, post_id):\n    return HttpResponse(f"You are reading post number {post_id}.")\n\`\`\`\n\nEvery view must return an \`HttpResponse\` or a subclass. A function that returns \`None\` causes a 500 error.`,
        tryIt: 'Write an about view that returns a sentence describing your project.'
      },
      {
        id: 'django-url-mapping',
        title: 'Connecting views to URLs',
        body: `A view only runs when a URL points at it. First, create a \`urls.py\` inside your app:\n\n\`\`\`python\n# blog/urls.py\nfrom django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path("", views.index, name="index"),\n    path("<int:post_id>/", views.detail, name="detail"),\n]\n\`\`\`\n\nThen include the app URLs in the project's \`urls.py\`:\n\n\`\`\`python\n# mysite/urls.py\nfrom django.urls import path, include\n\nurlpatterns = [\n    path("blog/", include("blog.urls")),\n    path("admin/", admin.site.urls),\n]\n\`\`\``,
        tryIt: 'Wire your about view to the /blog/about/ URL and visit it in the browser.'
      },
      {
        id: 'django-view-request',
        title: 'Using the request object',
        body: `The \`request\` object carries all information from the browser:\n\n\`\`\`python\ndef info(request):\n    method = request.method       # "GET" or "POST"\n    path = request.path           # e.g. "/blog/info/"\n    user_agent = request.META.get("HTTP_USER_AGENT", "")\n    name = request.GET.get("name", "stranger")  # ?name=Alice\n    return HttpResponse(f"Hello {name}, you used {method}")\n\`\`\`\n\n- \`request.GET\` is for query parameters\n- \`request.POST\` is for form submissions\n- \`request.META\` holds HTTP headers with uppercase \`HTTP_\` prefixes`,
        tryIt: 'Read a ?color= query parameter from the URL and return a sentence mentioning it.'
      },
      {
        id: 'django-class-views',
        title: 'Class-based views',
        body: `Class-based views (CBVs) are reusable. The simplest is \`View\`:\n\n\`\`\`python\nfrom django.views import View\nfrom django.http import HttpResponse\n\nclass HomeView(View):\n    def get(self, request):\n        return HttpResponse("GET request")\n\n    def post(self, request):\n        return HttpResponse("POST request")\n\`\`\`\n\nIn \`urls.py\`:\n\n\`\`\`python\npath("", HomeView.as_view(), name="home")\n\`\`\`\n\nSeparate \`get\` and \`post\` methods instead of one big \`if request.method\` block.`,
        tryIt: 'Convert one of your function-based views to a class-based view using View.'
      }
    ]
  },
  {
    id: 'django-templates',
    title: 'Templates',
    sections: [
      {
        id: 'django-render-shortcut',
        title: 'The render shortcut',
        body: `Instead of building \`HttpResponse\` manually, use \`render\`:\n\n\`\`\`python\nfrom django.shortcuts import render\n\ndef home(request):\n    context = {\n        "title": "My Blog",\n        "posts": ["First Post", "Second Post"]\n    }\n    return render(request, "blog/home.html", context)\n\`\`\`\n\nDjango looks for templates in \`blog/templates/blog/home.html\`. The context dictionary passes values to the template.`,
        tryIt: 'Create a template and render it from a view using the render shortcut with a context dictionary.'
      },
      {
        id: 'django-template-inheritance',
        title: 'Template inheritance (extends & block)',
        body: `Avoid duplicating HTML headers and footers with \`{% extends %}\`:\n\n\`\`\`html\n<!-- base.html -->\n<!DOCTYPE html>\n<html>\n<head><title>{% block title %}My Site{% endblock %}</title></head>\n<body>\n  <nav><a href="/">Home</a></nav>\n  <main>{% block content %}{% endblock %}</main>\n</body>\n</html>\n\`\`\`\n\nIn child templates:\n\n\`\`\`html\n<!-- home.html -->\n{% extends "base.html" %}\n\n{% block title %}Home — My Site{% endblock %}\n\n{% block content %}\n  <h1>Welcome!</h1>\n{% endblock %}\n\`\`\`\n\n\`extends\` must be the very first tag in a child template.`,
        tryIt: 'Create a base.html with a nav bar and extend it in two different page templates.'
      }
    ]
  },
  {
    id: 'django-models',
    title: 'Models & Database',
    sections: [
      {
        id: 'django-model-definition',
        title: 'Defining a model',
        body: `A model is a Python class that defines a database table:\n\n\`\`\`python\n# blog/models.py\nfrom django.db import models\n\nclass Post(models.Model):\n    title = models.CharField(max_length=200)\n    content = models.TextField()\n    published_date = models.DateTimeField(auto_now_add=True)\n    is_published = models.BooleanField(default=False)\n\n    def __str__(self):\n        return self.title\n\`\`\`\n\nEach attribute is a field in the database table. \`__str__\` determines how the model displays in the admin and shell.`,
        tryIt: 'Define a Book model with title, author, and pages fields in models.py.'
      },
      {
        id: 'django-migrations',
        title: 'Migrations',
        body: `Every time you change a model, run two commands:\n\n\`\`\`bash\n# Step 1: Detect changes and create migration files\npython manage.py makemigrations\n\n# Step 2: Apply migrations to the actual database\npython manage.py migrate\n\`\`\`\n\n\`makemigrations\` writes a Python file in \`blog/migrations/\`. \`migrate\` executes the SQL to update the database schema. Never edit migration files by hand unless you know what you are doing.`,
        tryIt: 'Add a field to your model, run makemigrations, then run migrate to update the database.'
      },
      {
        id: 'django-orm-queries',
        title: 'Querying data with the ORM',
        body: `Use the model's \`objects\` manager to query the database without SQL:\n\n\`\`\`python\nfrom blog.models import Post\n\n# Get all records\nall_posts = Post.objects.all()\n\n# Filter records (WHERE clause)\npublished = Post.objects.filter(is_published=True)\n\n# Get a single record (raises error if not found)\npost = Post.objects.get(id=1)\n\n# Create a new record\nnew_post = Post.objects.create(\n    title="Hello World",\n    content="First post content!"\n)\n\`\`\`\n\nDjango queries are lazy — they do not touch the database until you evaluate them (in a loop, list(), or template).`,
        tryIt: 'Run python manage.py shell and create two records using Post.objects.create(). Then query them with .all().'
      }
    ]
  },
  {
    id: 'django-cli',
    title: 'Django CLI Commands',
    sections: [
      {
        id: 'django-cli-essential',
        title: 'Essential manage.py commands',
        body: `The most important commands you will run daily:\n\n\`\`\`bash\n# Start dev server\npython manage.py runserver\n\n# Make migrations from model changes\npython manage.py makemigrations\n\n# Apply migrations to database\npython manage.py migrate\n\n# Create superuser for admin panel\npython manage.py createsuperuser\n\n# Open Python interactive shell with Django loaded\npython manage.py shell\n\n# Check for common configuration errors\npython manage.py check\n\`\`\`\n\n\`python manage.py check\` validates your settings, models, and URLs without starting a server.`,
        tryIt: 'Run python manage.py check and confirm it reports 0 issues.'
      }
    ]
  }
]
