import {createFileRoute} from "@tanstack/react-router";
import {handleExam} from "@/lib/exam.server";
export const Route=createFileRoute("/api/exam")({server:{handlers:{GET:({request})=>handleExam(request),POST:({request})=>handleExam(request)}}});
