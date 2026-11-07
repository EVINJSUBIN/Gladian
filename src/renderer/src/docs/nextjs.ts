import type { DocModule } from '../catalog'

export const nextjsModules: DocModule[] = [
  {
    id: 'next-setup',
    title: 'Setup & Structure',
    sections: [
      {
        id: 'next-create',
        title: 'Creating a Next.js App',
        body: `create-next-app scaffolds a complete Next.js project for you.\n\n\`\`\`bash\nnpx create-next-app@latest my-app\ncd my-app\nnpm run dev\n\`\`\`\n\nThen open http://localhost:3000.\n\nThe prompts ask about TypeScript, Tailwind, and the App Router. For learning, choose TypeScript = No, Tailwind = No, App Router = Yes the first time — fewer tools to learn at once.\n\nThe important folders:\n- app/ — your pages and routes (App Router)\n- public/ — static files (images, fonts)\n- package.json — dependencies and scripts`,
        tryIt: 'Create a new Next.js app, run npm run dev, and confirm you see the default page at localhost:3000.'
      },
      {
        id: 'next-app-router',
        title: 'The App Router',
        body: `Next.js 13+ uses the App Router. Each folder in app/ is a URL segment. A file called page.js (or page.jsx) inside that folder becomes the page.\n\n\`\`\`\napp/\n  page.js           → /\n  about/\n    page.js         → /about\n  blog/\n    page.js         → /blog\n    [slug]/\n      page.js       → /blog/my-post\n  layout.js         → shared layout (wraps all pages)\n\`\`\`\n\nlayout.js is special — it wraps every page under its folder. The root layout.js wraps the whole site and must include <html> and <body>.`,
        tryIt: 'Create an app/about/page.js file that exports a default function returning a heading. Then visit localhost:3000/about.'
      }
    ]
  },
  {
    id: 'next-pages',
    title: 'Pages & Components',
    sections: [
      {
        id: 'next-page-file',
        title: 'Writing a Page',
        body: `A page file must export a default React component. The component's return value is what the route renders.\n\n\`\`\`jsx\n// app/about/page.js\nexport default function AboutPage() {\n    return (\n        <main>\n            <h1>About Us</h1>\n            <p>We build things with Next.js.</p>\n        </main>\n    )\n}\n\`\`\`\n\nThe file must be named page.js (or page.jsx / page.tsx). Any other name in the folder does not become a route — it is just a module.`,
        tryIt: 'Create a /contact page that returns a heading and a paragraph with fake contact information.'
      },
      {
        id: 'next-layout',
        title: 'The Root Layout',
        body: `The root layout in app/layout.js wraps every page on the site.\n\n\`\`\`jsx\n// app/layout.js\nexport const metadata = {\n    title: 'My App',\n    description: 'A Next.js application'\n}\n\nexport default function RootLayout({ children }) {\n    return (\n        <html lang="en">\n            <body>\n                <nav>\n                    <a href="/">Home</a>\n                    <a href="/about">About</a>\n                </nav>\n                <main>{children}</main>\n                <footer>© 2024 My App</footer>\n            </body>\n        </html>\n    )\n}\n\`\`\`\n\nchildren is the page component for the current route. The nav and footer appear on every page because they are in the layout.`,
        tryIt: 'Add a simple nav bar to the root layout with links to your Home and About pages. Confirm it appears on both.'
      },
      {
        id: 'next-link',
        title: 'Linking Between Pages',
        body: `Use the Link component from next/link for client-side navigation — faster than a plain <a> tag.\n\n\`\`\`jsx\nimport Link from 'next/link'\n\nexport default function HomePage() {\n    return (\n        <main>\n            <h1>Home</h1>\n            <p>\n                <Link href="/about">Go to About</Link>\n            </p>\n            <p>\n                <Link href="/blog/hello-world">Read my post</Link>\n            </p>\n        </main>\n    )\n}\n\`\`\`\n\nLink prefetches the destination page in the background so navigation feels instant. Use Link for internal links. Use a plain <a> for external URLs.`,
        tryIt: 'Replace any <a href="/about"> in your site with <Link href="/about"> and notice that navigation feels instant.'
      }
    ]
  },
  {
    id: 'next-server-client',
    title: 'Server vs Client Components',
    sections: [
      {
        id: 'next-server-component',
        title: 'Server Components (Default)',
        body: `In the App Router, every component is a Server Component by default. They run on the server — no JavaScript is sent to the browser.\n\n\`\`\`jsx\n// app/page.js — this runs on the server\nexport default async function HomePage() {\n    // You can fetch data directly here — no useEffect needed\n    const response = await fetch('https://api.github.com/users/vercel')\n    const user = await response.json()\n\n    return (\n        <main>\n            <h1>GitHub User</h1>\n            <p>Followers: {user.followers}</p>\n            <p>Public repos: {user.public_repos}</p>\n        </main>\n    )\n}\n\`\`\`\n\nServer Components cannot use useState, useEffect, or browser APIs. They are great for fetching data and rendering static content.`,
        tryIt: 'Create a server component that fetches data from a public API and renders it on the page — no useState or useEffect.'
      },
      {
        id: 'next-client-component',
        title: 'Client Components',
        body: `Add "use client" at the top to make a component run in the browser. Use this for interactivity.\n\n\`\`\`jsx\n"use client"\n\nimport { useState } from 'react'\n\nexport default function Counter() {\n    const [count, setCount] = useState(0)\n\n    return (\n        <div>\n            <p>Count: {count}</p>\n            <button onClick={() => setCount(count + 1)}>\n                Increment\n            </button>\n        </div>\n    )\n}\n\`\`\`\n\nClient Components can use useState, useEffect, onClick, and all browser APIs. Keep them as small as possible — only the interactive parts need to be client components.`,
        tryIt: 'Create a Counter client component and import it into a server component page. Verify the counter works in the browser.'
      }
    ]
  },
  {
    id: 'next-data',
    title: 'Data Fetching',
    sections: [
      {
        id: 'next-fetch-server',
        title: 'Fetching in Server Components',
        body: `Fetch data directly in async Server Components — no extra libraries or useEffect needed.\n\n\`\`\`jsx\n// app/posts/page.js\nexport default async function PostsPage() {\n    // Next.js extends fetch with caching options\n    const response = await fetch('https://jsonplaceholder.typicode.com/posts', {\n        next: { revalidate: 60 }  // cache for 60 seconds\n    })\n    const posts = await response.json()\n\n    return (\n        <ul>\n            {posts.slice(0, 10).map((post) => (\n                <li key={post.id}>\n                    <strong>{post.title}</strong>\n                    <p>{post.body.slice(0, 80)}…</p>\n                </li>\n            ))}\n        </ul>\n    )\n}\n\`\`\`\n\nnext: { revalidate: 60 } tells Next.js to re-fetch and update the cache every 60 seconds. Use { cache: 'no-store' } to always fetch fresh data.`,
        tryIt: 'Fetch a list of posts from jsonplaceholder.typicode.com/posts and render the first 5 titles on a /posts page.'
      },
      {
        id: 'next-dynamic-routes',
        title: 'Dynamic Routes',
        body: 'Square brackets in a folder name create a dynamic segment.\n\n```\napp/blog/[slug]/page.js  →  /blog/hello-world\n```\n\n```jsx\n// app/blog/[slug]/page.js\nexport default async function BlogPost({ params }) {\n    const { slug } = params\n\n    const response = await fetch(\'https://jsonplaceholder.typicode.com/posts/\' + slug)\n    const post = await response.json()\n\n    return (\n        <article>\n            <h1>{post.title}</h1>\n            <p>{post.body}</p>\n        </article>\n    )\n}\n```\n\nparams.slug is the value from the URL. /blog/5 gives you slug = "5". The page component receives params as a prop.',
        tryIt: 'Create a /blog/[id]/page.js that fetches a single post from jsonplaceholder.typicode.com/posts/{id} using the URL param.'
      }
    ]
  },
  {
    id: 'next-api',
    title: 'Route Handlers (API)',
    sections: [
      {
        id: 'next-route-handler',
        title: 'Creating API Endpoints',
        body: `A file called route.js inside the app/ folder creates an API endpoint, not a page.\n\n\`\`\`\napp/api/hello/route.js  →  /api/hello\n\`\`\`\n\n\`\`\`javascript\n// app/api/hello/route.js\nimport { NextResponse } from 'next/server'\n\nexport async function GET(request) {\n    return NextResponse.json({ message: 'Hello from Next.js!', ok: true })\n}\n\nexport async function POST(request) {\n    const body = await request.json()\n    return NextResponse.json({ received: body })\n}\n\`\`\`\n\nExport a function named GET, POST, PUT, DELETE, etc. to handle that HTTP method. NextResponse.json() sets Content-Type: application/json automatically.`,
        tryIt: 'Create an API route at /api/status that returns JSON with a status field and the current timestamp.'
      }
    ]
  }
]
