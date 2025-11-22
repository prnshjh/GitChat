"use client"

import React, { useState } from "react"
import useProject from "~/hooks/use-project"
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Textarea } from "~/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import Image from "next/image"
import { readStreamableValue } from "ai/rsc"
import MarkdownPreview from "@uiw/react-markdown-preview"
import { useTheme } from "next-themes"
import { api } from "~/trpc/react"
import { toast } from "sonner"
import useRefetch from "~/hooks/use-refetch"
import { askQuestion } from "./action"
import CodeRefrence from "./code-refrence"

const AskQuestionCard = () => {
  const { project } = useProject()
  const { theme } = useTheme()
  const [question, setQuestion] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filesReferences, setFilesReferences] = useState<{
    fileName: string
    sourceCode: string
    summary: string
  }[]>([])
  const [answer, setAnswer] = useState("")
  const saveAnswer = api.project.saveAnswer.useMutation()
  const refetch = useRefetch()

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!project?.id) {
      toast.error("Please select a project first")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter a question")
      return
    }

    setAnswer("")
    setFilesReferences([])
    setLoading(true)

    try {
      const { output, filesReferences: refs } = await askQuestion(question, project.id)

      setFilesReferences(refs || [])
      setOpen(true)

      for await (const delta of readStreamableValue(output)) {
        if (delta) {
          setAnswer((ans) => ans + delta)
        }
      }

      toast.success("Answer generated successfully")
    } catch (error: any) {
      console.error("Error asking question:", error)
      toast.error(error?.message || "Failed to generate answer")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnswer = () => {
    if (!project?.id || !question || !answer) {
      toast.error("Cannot save incomplete answer")
      return
    }

    saveAnswer.mutate(
      {
        projectId: project.id,
        question,
        answer,
        filesRefrences: filesReferences,
      },
      {
        onSuccess: () => {
          toast.success("Answer saved successfully")
          refetch()
        },
        onError: (error) => {
          console.error("Save error:", error)
          toast.error("Failed to save answer")
        },
      }
    )
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[73vw] max-h-[90vh] overflow-auto py-4">
          <DialogHeader>
            {/* 🔹 GitChat logo + Save button inline, like screenshot */}
            <div className="flex items-center gap-3">
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Image src="/favicon.ico" alt="logo" width={40} height={40} />
                  <h1 className="text-2xl font-bold">GitChat</h1>
                </div>
              </DialogTitle>

              <Button
                variant="outline"
                size="sm"
                disabled={saveAnswer.isPending || !answer}
                onClick={handleSaveAnswer}
                className="rounded-full px-4 py-1 h-8 text-sm shadow-sm"
              >
                {saveAnswer.isPending ? "Saving..." : "Save Answer"}
              </Button>
            </div>
          </DialogHeader>

          {/* Answer Display */}
          <div className="max-h-[30vh] overflow-auto mb-2">
            {answer ? (
              <MarkdownPreview
                source={answer}
                className="max-w-[70vw]"
                style={{ padding: "1rem", background: "transparent" }}
                wrapperElement={{
                  "data-color-mode": theme === "dark" ? "dark" : "light",
                }}
              />
            ) : loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-muted-foreground">Generating answer...</span>
              </div>
            ) : (
              <p className="text-muted-foreground p-4">No answer yet</p>
            )}
          </div>

          {/* Code References */}
          {filesReferences.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">
                Referenced Files ({filesReferences.length})
              </h3>
              <CodeRefrence filesRefrences={filesReferences} />
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 border rounded-md py-2 px-4 bg-primary/40 hover:bg-primary/60 transition-colors"
          >
            Close
          </button>
        </DialogContent>
      </Dialog>

      <Card className="relative col-span-3">
        <CardHeader>
          <CardTitle>Ask a question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit}>
            <Textarea
              className="h-28 resize-none"
              placeholder="Which file should I edit to change the home page?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={loading}
            />
            <div className="h-4" />
            <Button type="submit" disabled={loading || !question.trim() || !project?.id}>
              {loading ? "Asking GitChat..." : "Ask GitChat!"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default AskQuestionCard
