import type { DocModule } from '../catalog'

export const djangoModules: DocModule[] = [
  {
    id: 'django-setup',
    title: 'Setup & Project Creation',
    sections: [
      {
        id: 'django-install',
        title: 'Install Django',
        body: 'Install Django using pip inside a virtual environment:\n\npip install django\n\nCheck the installed version:\n\npython -m django --version\n\nDjango versions matter. 4.x and 5.x are both in common use. The commands and patterns in this guide work for both.',
        tryIt: 'Install Django in a fresh virtual environment and print the version number.'
      },
      {
        id: 'django-startproject',
        title: 'Create a project',
        body: 'The django-admin command creates a new project skeleton:\n\ndjango-admin startproject mysite\n\nThis creates a folder called mysite with this structure:\n\nmysite/\n  manage.py          # your command-line tool\n  mysite/\n    __init__.py\n    settings.py      # project configuration\n    urls.py          # the top-level URL table\n    wsgi.py          # production server entry point\n    asgi.py          # async server entry point\n\nThe outer mysite/ is your working directory. The inner mysite/ is the Python package.',
        tryIt: 'Create a project, cd into it, and list its files to understand the structure.'
      },
      {
        id: 'django-startapp',
        title: 'Create an app inside the project',
        body: 'A Django project is split into apps. Create one with manage.py:\n\ncd mysite\npython manage.py startapp blog\n\nThis creates:\n\nblog/\n  __init__.py\n  admin.py\n  apps.py\n  models.py     # database tables\n  tests.py\n  views.py      # your view functions\n  migrations/\n\nThen register the app in settings.py:\n\nINSTALLED_APPS = [\n    "blog",           # add this line\n    "django.contrib.admin",\n    # ...\n]',
        tryIt: 'Create a blog app, add it to INSTALLED_APPS, and confirm the server still starts.'
      },
      {
        id: 'django-runserver',
        title: 'Start the development server',
        body: 'The Django development server reloads on file changes:\n\npython manage.py runserver\n\n# Custom port:\npython manage.py runserver 8080\n\n# Accessible from other devices on the network:\npython manage.py runserver 0.0.0.0:8000\n\nVisit http://127.0.0.1:8000. You should see the Django welcome page. The server is for development only — it handles one request at a time.',
        tryIt: 'Start the server and open the welcome page. Then change the port to 9000 and open that.'
      }
    ]
  },
  {
    id: 'django-views',
    title: 'Views',
    sections: [
      {
        id: 'django-view-function',
        title: 'Writing a view function',
        body: 'A view is a Python function in views.py that takes a request and returns a response:\n\n# blog/views.py\nfrom django.http import HttpResponse\n\ndef index(request):\n    return HttpResponse("Hello from the blog index!")\n\ndef detail(request, post_id):\n    return HttpResponse(f"You are reading post number {post_id}.")\n\nEvery view must return an HttpResponse or a subclass. A function that returns None causes an error.',
        tryIt: 'Write an about view that returns a sentence describing your project.'
      },
      {
        id: 'django-url-mapping',
        title: 'Connecting views to URLs',
        body: 'A view only runs when a URL points at it. First, create a urls.py inside your app:\n\n# blog/urls.py\nfrom django.urls import path\nfrom . import views\n\nurlpatterns = [\n    path("", views.index, name="index"),\n    path("<int:post_id>/", views.detail, name="detail"),\n]\n\nThen include the app URLs in the project\'s urls.py:\n\n# mysite/urls.py\nfrom django.urls import path, include\n\nurlpatterns = [\n    path("blog/", include("blog.urls")),\n    path("admin/", admin.site.urls),\n]',
        tryIt: 'Wire your about view to the /blog/about/ URL and visit it in the browser.'
      },
      {
        id: 'django-view-request',
        title: 'Using the request object',
        body: 'The request object carries all information from the browser:\n\ndef info(request):\n    method = request.method       # "GET" or "POST"\n    path = request.path           # e.g. "/blog/info/"\n    user_agent = request.META.get("HTTP_USER_AGENT", "")\n    name = request.GET.get("name", "stranger")  # ?name=Alice\n    return HttpResponse(f"Hello {name}, you used {method}")\n\nrequest.GET is for query parameters.\nrequest.POST is for form submissions.\nrequest.META holds HTTP headers with uppercase HTTP_ prefixes.',
        tryIt: 'Read a ?color= query parameter from the URL and return a sentence mentioning it.'
      },
      {
        id: 'django-class-views',
        title: 'Class-based views',
        body: 'Class-based views (CBVs) are reusable. The simplest is View:\n\nfrom django.views import View\nfrom django.http import HttpResponse\n\nclass HomeView(View):\n    def get(self, request):\n        return HttpResponse("GET request")\n\n    def post(self, request):\n        return HttpResponse("POST request")\n\n# In urls.py:\npath("", HomeView.as_view(), name="home")\n\nSeparate get and post methods instead of one big if request.method block.',
        tryIt: 'Convert one of your function-based views to a class-based view using View.'
      }
    ]
  },
  {
    id: 'django-templates',
    title: 'Templates',
    sections: [
      {
        id: 'django-template-setup',
        title: 'Setting up templates',
        body: 'Create a templates/ folder inside your app. Register it in settings.py:\n\n# settings.py\nTEMPLATES = [{\n    "BACKEND": "django.template.backends.django.DjangoTemplates",\n    "DIRS": [],\n    "APP_DIRS": True,   # looks in app/templates/ folders\n    "OPTIONS": {...},\n}]\n\nCreate the template file:\n# blog/templates/blog/index.html\n# <!DOCTYPE html>\n# <html><body><h1>Blog</h1></body></html>\n\nThe path blog/templates/blog/ is intentional — the inner blog/ namespace avoids name collisions.',
        tryIt: 'Create a template file and render it from your index view.'
      },
      {
        id: 'django-render',
        title: 'Rendering templates',
        body: 'Use the render shortcut to render a template with context:\n\nfrom django.shortcuts import render\n\ndef index(request):\n    posts = [\n        {"title": "First Post", "author": "Alice"},\n        {"title": "Second Post", "author": "Bob"},\n    ]\n    context = {"posts": posts, "page_title": "Blog"}\n    return render(request, "blog/index.html", context)\n\nIn the template:\n# <h1>{{ page_title }}</h1>\n# {% for post in posts %}\n#   <h2>{{ post.title }} by {{ post.author }}</h2>\n# {% endfor %}',
        tryIt: 'Pass a list of three items to a template and loop through them.'
      },
      {
        id: 'django-template-tags',
        title: 'Template tags and filters',
        body: 'Django templates support tags ({% %}) and filters (|):\n\n# Tags:\n{% if user.is_authenticated %}\n  <p>Welcome back!</p>\n{% else %}\n  <p>Please log in.</p>\n{% endif %}\n\n{% for item in items %}\n  <li>{{ forloop.counter }}. {{ item }}</li>\n{% endfor %}\n\n# Filters (modify values in output):\n{{ title|upper }}              # UPPERCASE\n{{ text|truncatewords:10 }}   # first 10 words\n{{ date|date:"Y-m-d" }}       # format a date\n{{ items|length }}             # list length',
        tryIt: 'Display a list of items numbered 1, 2, 3... using forloop.counter.'
      },
      {
        id: 'django-template-inheritance',
        title: 'Template inheritance',
        body: 'Share a base layout across all pages:\n\n# blog/templates/blog/base.html\n# <!DOCTYPE html>\n# <html>\n# <head>\n#   <title>{% block title %}My Blog{% endblock %}</title>\n# </head>\n# <body>\n#   <nav>Blog | <a href="/">Home</a></nav>\n#   <main>{% block content %}{% endblock %}</main>\n# </body>\n# </html>\n\n# blog/templates/blog/index.html\n# {% extends "blog/base.html" %}\n# {% block title %}All Posts{% endblock %}\n# {% block content %}\n#   <h1>All Posts</h1>\n# {% endblock %}',
        tryIt: 'Create a base template and have two pages extend it with their own content blocks.'
      }
    ]
  },
  {
    id: 'django-models',
    title: 'Models & Database',
    sections: [
      {
        id: 'django-model-class',
        title: 'Defining a model',
        body: 'A model is a Python class that maps to a database table:\n\n# blog/models.py\nfrom django.db import models\n\nclass Post(models.Model):\n    title = models.CharField(max_length=200)\n    body = models.TextField()\n    published = models.BooleanField(default=False)\n    created_at = models.DateTimeField(auto_now_add=True)\n\n    def __str__(self):\n        return self.title\n\nEach class attribute is a column. Django handles the CREATE TABLE SQL for you.',
        tryIt: 'Define a Comment model with an author CharField and a text TextField.'
      },
      {
        id: 'django-migrations',
        title: 'Running migrations',
        body: 'Two commands sync your models to the database:\n\n# Step 1: Create migration files from your models\npython manage.py makemigrations\n\n# Step 2: Apply them to the database\npython manage.py migrate\n\nRun both every time you change a model. The migration files in migrations/ track the history of your schema.\n\npython manage.py showmigrations   # list all migrations and their status\npython manage.py sqlmigrate blog 0001  # see the SQL a migration would run',
        tryIt: 'Create a model, run makemigrations, then migrate. Check the generated SQL with sqlmigrate.'
      },
      {
        id: 'django-orm-basics',
        title: 'Querying with the ORM',
        body: 'The ORM lets you query the database using Python:\n\n# Get all posts\nposts = Post.objects.all()\n\n# Filter\npublished = Post.objects.filter(published=True)\n\n# Get one or raise 404\nfrom django.shortcuts import get_object_or_404\npost = get_object_or_404(Post, pk=1)\n\n# Create\npost = Post.objects.create(\n    title="New Post",\n    body="Content here"\n)\n\n# Update\npost.title = "Updated Title"\npost.save()\n\n# Delete\npost.delete()',
        tryIt: 'Create three Post objects, then filter them by published=True and print the titles.'
      },
      {
        id: 'django-admin',
        title: 'The Django admin',
        body: 'Register models to manage them in Django\'s built-in admin interface:\n\n# blog/admin.py\nfrom django.contrib import admin\nfrom .models import Post\n\n@admin.register(Post)\nclass PostAdmin(admin.ModelAdmin):\n    list_display = ("title", "published", "created_at")\n    list_filter = ("published",)\n    search_fields = ("title", "body")\n\nCreate a superuser to log in:\n\npython manage.py createsuperuser\n\nThen visit http://127.0.0.1:8000/admin',
        tryIt: 'Register your Post model with a custom PostAdmin that shows the title and created_at columns.'
      }
    ]
  },
  {
    id: 'django-forms',
    title: 'Forms',
    sections: [
      {
        id: 'django-form-class',
        title: 'Defining a form',
        body: 'Django forms handle validation and HTML rendering:\n\n# blog/forms.py\nfrom django import forms\n\nclass PostForm(forms.Form):\n    title = forms.CharField(\n        max_length=200,\n        widget=forms.TextInput(attrs={"placeholder": "Post title"})\n    )\n    body = forms.CharField(\n        widget=forms.Textarea(attrs={"rows": 6})\n    )\n    published = forms.BooleanField(required=False)\n\nThe form class defines fields, types, and validation rules. Widget controls the HTML element.',
        tryIt: 'Create a form class with a name CharField and an email EmailField.'
      },
      {
        id: 'django-form-view',
        title: 'Handling a form in a view',
        body: 'Process GET and POST in one view:\n\nfrom .forms import PostForm\n\ndef create_post(request):\n    if request.method == "POST":\n        form = PostForm(request.POST)\n        if form.is_valid():\n            title = form.cleaned_data["title"]\n            body = form.cleaned_data["body"]\n            Post.objects.create(title=title, body=body)\n            return redirect("index")\n    else:\n        form = PostForm()\n    return render(request, "blog/create.html", {"form": form})\n\nform.is_valid() runs all validators. cleaned_data holds the validated values.',
        tryIt: 'Build a view that processes a name form and redirects to / on success.'
      },
      {
        id: 'django-form-template',
        title: 'Rendering the form in a template',
        body: 'The form object renders its own HTML fields:\n\n# blog/templates/blog/create.html\n# <form method="POST">\n#   {% csrf_token %}\n#   {{ form.as_p }}\n#   <button type="submit">Save</button>\n# </form>\n\n{% csrf_token %} adds the CSRF hidden field — Django rejects forms without it.\n\n{{ form.as_p }} renders each field wrapped in a <p> tag.\n{{ form.as_table }} uses table rows.\n{{ form.as_ul }} uses list items.\n\nYou can also render fields individually:\n# {{ form.title.label_tag }}\n# {{ form.title }}',
        tryIt: 'Render a form with {{ form.as_p }} and test submitting it.'
      }
    ]
  },
  {
    id: 'django-cli',
    title: 'manage.py Commands',
    sections: [
      {
        id: 'django-common-commands',
        title: 'Essential commands reference',
        body: 'The commands you will use constantly:\n\n# Development server\npython manage.py runserver\npython manage.py runserver 8080\n\n# Database\npython manage.py makemigrations\npython manage.py migrate\npython manage.py showmigrations\n\n# User management\npython manage.py createsuperuser\npython manage.py changepassword username\n\n# App creation\npython manage.py startapp myapp\n\n# Interactive Python shell with Django loaded\npython manage.py shell\n\n# Check the project for problems\npython manage.py check\n\n# Collect static files for production\npython manage.py collectstatic',
        tryIt: 'Run python manage.py check on your project and read what it reports.'
      },
      {
        id: 'django-shell',
        title: 'The Django shell',
        body: 'The shell gives you a Python prompt with your project already imported:\n\npython manage.py shell\n\n# Inside the shell:\n>>> from blog.models import Post\n>>> Post.objects.all()\n<QuerySet []>\n>>> Post.objects.create(title="Test", body="Hello")\n<Post: Test>\n>>> Post.objects.count()\n1\n>>> Post.objects.first().title\n\'Test\'\n\nUse the shell to test ORM queries and inspect your data without writing a view.',
        tryIt: 'Open the shell and create two Post objects, then query them with filter().'
      },
      {
        id: 'django-custom-command',
        title: 'Custom management commands',
        body: 'Add your own manage.py commands by creating files in a management/commands/ folder:\n\n# blog/management/__init__.py  (empty)\n# blog/management/commands/__init__.py  (empty)\n# blog/management/commands/seed_data.py\n\nfrom django.core.management.base import BaseCommand\nfrom blog.models import Post\n\nclass Command(BaseCommand):\n    help = "Seeds the database with sample posts"\n\n    def handle(self, *args, **options):\n        Post.objects.create(title="Sample Post", body="Content.")\n        self.stdout.write(self.style.SUCCESS("Seeded successfully!"))\n\n# Run it:\npython manage.py seed_data',
        tryIt: 'Create a custom command that prints the count of posts in the database.'
      }
    ]
  }
]
