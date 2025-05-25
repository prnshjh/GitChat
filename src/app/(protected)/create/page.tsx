'use client'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useRefetch from '@/hooks/use-refetch';
import { api } from '@/trpc/react';
import React from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner';
import { date } from 'zod';

type FormInput = {
    repoUrl: string;
    projectName: string;
    githubToken?: string;
}
const CreatePage = () => {
    const { register, handleSubmit, reset } = useForm<FormInput>()
    const createProject = api.project.createProject.useMutation();
    const refetch = useRefetch();

    function onSubmit(data: FormInput) {

        createProject.mutate({
            githubUrl: data.repoUrl,
            name: data.projectName,
            githubToken: data.githubToken

        }, {
            onSuccess: () => {
                toast.success('Project created successfully');
                refetch();
                reset();
            },
            onError: () => {
                toast.error(`Failed to create project`);
            }

        },
        )
        return true;
    }
    return (
        <div className="flex h-full items-center justify-center gap-12">
            <img src="/coding.svg" className="h-56 w-auto" />
            <div>
                <div>
                    <h1 className="text-2xl font-semibold">
                        Link your Github Repository
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Enter the URL of your repository to link it to Dionysus
                    </p>
                </div>

                <div className="h4"></div>

                <div>
                    <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 mb-2 text-red-700">
                        <div className="flex items-center gap-2">

                            <p className="text-sm">
                                It is suggested to link repository with {" "}
                                <strong> less than 50 files</strong> for best experience.
                            </p>
                        </div>

                    </div>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            {...register("projectName", { required: true })}
                            placeholder="Project Name"
                            required
                        />

                        <div className="h-2"></div>

                        <Input
                            {...register("repoUrl", { required: true })}
                            placeholder="Github URL"
                            type="url"
                            required
                        />

                        <div className="h-2"></div>

                        <Input
                            {...register("githubToken")}
                            placeholder="Github Token (optional)"
                        />



                        <div className="h-4"></div>


                        <Button
                            type="submit"
                            disabled={
                                createProject.isPending

                            }
                        >
                            Create Project
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default CreatePage;