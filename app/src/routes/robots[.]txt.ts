import {createFileRoute} from "@tanstack/react-router";
export const Route=createFileRoute("/robots.txt")({server:{handlers:{GET:()=>new Response("User-agent: *\nAllow: /\nDisallow: /exam\nDisallow: /reports\nDisallow: /api/\nSitemap: https://algonexexam.savanijaswanth20.workers.dev/sitemap.xml\n",{headers:{"Content-Type":"text/plain"}})}}});
