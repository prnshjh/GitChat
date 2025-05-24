'use client'

import { Button } from "@/components/ui/button"
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { Bot, CreditCard, LayoutDashboard, Plus, Presentation } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

const projects = [
    { id: "1", name: "Project Alpha" },
    { id: "2", name: "Project Beta" },
    { id: "3", name: "Project Gamma" },



]
const items = [
    {
        title: "Dashboard",
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: "Q&A",
        url: '/qa',
        icon: Bot,
    },

    {
        title: "Meetings",
        url: '/meetings',
        icon: Presentation,
    },

    {
        title: "Billing",
        url: '/billing',
        icon: CreditCard,
    },


];

const AppSidebar = () => {
    const pathname = usePathname()
    const { open } = useSidebar();
    return (
        <Sidebar collapsible="icon" variant="floating">
            <SidebarHeader>
                <div className="flex items-center gap-2">   
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-md" />
                    {open &&(<h1 className="text-xl font-bold text-primary/80">GitChat</h1>)}
                    
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Application
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map(item => {
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <Link href={item.url} className={cn({ '!bg-primary !text-white': pathname === item.url }, 'list-none')}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>

                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Your Projects</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects.map(project => {
                                return (
                                    <SidebarMenuItem key={project.name}>
                                        <SidebarMenuButton asChild>
                                            <button className="flex items-center gap-2 w-full">
                                                <div
                                                    className={cn(
                                                        "flex size-6 items-center justify-center rounded-sm border bg-white text-sm text-primary",
                                                        {
                                                            "bg-primary text-white": true,
                                                        },
                                                    )}
                                                >
                                                    {project.name[0]}
                                                </div>
                                                <span>{project.name}</span>
                                            </button>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}

                            <div className="h-2"></div>
                            {open &&(<SidebarMenuItem>
                                <Link href='/create'>
                                <Button size='sm' variant={'outline'} className="w-fit"> <Plus/> Create Project</Button>
                                    </Link>
                            </SidebarMenuItem>)}
                            
                             
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    )
}

export default AppSidebar