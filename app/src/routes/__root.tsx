import {QueryClient,QueryClientProvider} from "@tanstack/react-query";
import {Outlet,createRootRouteWithContext,HeadContent,Scripts,useRouter} from "@tanstack/react-router";
import {useEffect,type ReactNode} from "react";
import appCss from "../styles.css?url";
import meta from "../app-meta.json";
import {reportHiggsfieldError} from "../lib/higgsfield-error-reporting";
declare const __HF_DESIGN_INSPECTOR__:boolean;
const origin="https://mysql-exam-studio.higgsfield.app";
export const Route=createRootRouteWithContext<{queryClient:QueryClient}>()({
 head:()=>({meta:[{charSet:"utf-8"},{name:"viewport",content:"width=device-width, initial-scale=1"},{title:meta.og_title},{name:"description",content:meta.og_description},{name:"author",content:"MySQL Exam Studio"},{name:"theme-color",content:meta.theme_color},{name:"robots",content:"index, follow"},{property:"og:title",content:meta.og_title},{property:"og:description",content:meta.og_description},{property:"og:type",content:"website"},{property:"og:url",content:origin},{property:"og:image",content:origin+meta.og_image_url},{name:"twitter:card",content:"summary_large_image"},{name:"twitter:image",content:origin+meta.og_image_url}],
 links:[{rel:"stylesheet",href:appCss},{rel:"icon",href:meta.favicon_url},{rel:"apple-touch-icon",href:"/assets/apple-touch-icon.png"},{rel:"manifest",href:"/site.webmanifest"}]}),
 shellComponent:RootShell,component:RootComponent,notFoundComponent:NotFound,errorComponent:ErrorPage
});
function RootShell({children}:{children:ReactNode}){return <html lang="en" style={{colorScheme:"light"}}><head><HeadContent/></head><body>{children}<Scripts/></body></html>}
import {AuthProvider} from "../lib/auth-context";
function RootComponent(){const {queryClient}=Route.useRouteContext();useEffect(()=>{if(__HF_DESIGN_INSPECTOR__)void import("../module/design-inspector/runtime").then(({installHiggsfieldDesignInspector})=>installHiggsfieldDesignInspector()).catch(error=>reportHiggsfieldError(error instanceof Error?error:new Error("Inspector could not load"),{boundary:"inspector"}))},[]);return <QueryClientProvider client={queryClient}><AuthProvider><Outlet/></AuthProvider></QueryClientProvider>}
function NotFound(){return <main className="root-error"><h1>Page not found.</h1><p>Return to your assessment workspace.</p><a href="/">Go to overview</a></main>}
function ErrorPage({reset}:{reset:()=>void}){const router=useRouter();return <main className="root-error"><h1>We could not open this page.</h1><p>Your saved answers are retained. Please try again.</p><button onClick={()=>{void router.invalidate();reset()}}>Try again</button><a href="/">Go to overview</a></main>}
