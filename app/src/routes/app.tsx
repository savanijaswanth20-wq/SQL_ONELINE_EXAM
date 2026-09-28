import {createFileRoute,redirect} from "@tanstack/react-router";
// previewMode handled via redirect
export const Route=createFileRoute("/app")({beforeLoad:()=>{throw redirect({to:"/"})}});
