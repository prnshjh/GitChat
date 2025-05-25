"use client";
import useProject from "@/hooks/use-project";
import { ExternalLink, Github} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

type Props = {};

const DashboardPage = ({}: Props) => {
  const { project } = useProject();
  return (
    <div>
      
    </div>
  );
};

export default DashboardPage;
