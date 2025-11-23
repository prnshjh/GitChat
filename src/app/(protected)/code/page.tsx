"use client"

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react"
import {
  Loader2,
  Copy,
  Download,
  Sparkles,
  FileText,
  StopCircle,
  Eraser,
  Terminal as TerminalIcon,
  Check,
  X,
  Github,
  PlusCircle,
  Edit3,
} from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Textarea } from "~/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Badge } from "~/components/ui/badge"
import { toast } from "sonner"
import { cn } from "~/lib/utils"

// AI SDK & Syntax Highlighting
import { readStreamableValue } from "ai/rsc"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import { generateCodeStream } from "~/lib/gemini-code"

type LanguageOption = {
  value: string
  label: string
  extension: string
  color: string
}

type CodeFile = {
  id: string
  name: string
  content: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { value: "typescript", label: "TypeScript", extension: "ts", color: "text-blue-400" },
  { value: "javascript", label: "JavaScript", extension: "js", color: "text-yellow-400" },
  { value: "python", label: "Python", extension: "py", color: "text-green-400" },
  { value: "go", label: "Go", extension: "go", color: "text-cyan-400" },
  { value: "rust", label: "Rust", extension: "rs", color: "text-orange-400" },
  { value: "java", label: "Java", extension: "java", color: "text-red-400" },
  { value: "css", label: "CSS", extension: "css", color: "text-blue-300" },
  { value: "html", label: "HTML", extension: "html", color: "text-orange-500" },
  { value: "sql", label: "SQL", extension: "sql", color: "text-purple-400" },
]

type GenerateCodeStreamResult = {
  output: AsyncIterable<string> | ReadableStream<Uint8Array> | string | any
}

export default function ModernCodeGenPage(): JSX.Element {
  const [prompt, setPrompt] = useState<string>("")
  const [language, setLanguage] = useState<string>("typescript")
  const [filename, setFilename] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [output, setOutput] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("generate")
  const [copied, setCopied] = useState<boolean>(false)

  // keep terminal visible until user closes it
  const [showTerminal, setShowTerminal] = useState<boolean>(false)

  // Example project context (you can replace with your actual project selection/state)
  const project = {
    name: "UVA",
    repoUrl: "/mnt/data/92ac4836-7c2a-4381-8b92-d3fe2d34cdcf.png",
  }

  const controllerRef = useRef<AbortController | null>(null)
  const stopRef = useRef<boolean>(false)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // ---------- TERMINAL RESIZE ----------
  const [terminalHeight, setTerminalHeight] = useState<number>(360)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const resizeStartY = useRef<number | null>(null)
  const resizeStartHeight = useRef<number | null>(null)

  // ---------- EDITOR RESIZE ----------
  const [editorHeight, setEditorHeight] = useState<number>(320)
  const [isResizingEditor, setIsResizingEditor] = useState<boolean>(false)
  const editorResizeStartY = useRef<number | null>(null)
  const editorResizeStartHeight = useRef<number | null>(null)

  // editor scroll sync refs
  const editorTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const editorHighlightRef = useRef<HTMLDivElement | null>(null)

  const currentLangInfo = useMemo(
    () => LANGUAGE_OPTIONS.find((l) => l.value === language) ?? LANGUAGE_OPTIONS[0],
    [language]
  )

  // ------- Mini IDE state -------
  const [files, setFiles] = useState<CodeFile[]>(() => [
    {
      id: "file-1",
      name: `main.${(LANGUAGE_OPTIONS.find((l) => l.value === "typescript") ??
        LANGUAGE_OPTIONS[0]).extension}`,
      content: "// Start typing your code here...\n",
    },
  ])
  const [activeFileId, setActiveFileId] = useState<string>("file-1")

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) ?? files[0],
    [files, activeFileId]
  )

  const handleCreateFile = () => {
    const ext = currentLangInfo.extension || "txt"
    const index = files.length + 1
    const newFile: CodeFile = {
      id: `file-${Date.now()}`,
      name: `file-${index}.${ext}`,
      content: "",
    }
    setFiles((prev) => [...prev, newFile])
    setActiveFileId(newFile.id)
  }

  const handleRenameFile = (id: string) => {
    const file = files.find((f) => f.id === id)
    if (!file) return
    const nextName = window.prompt("Rename file", file.name)
    if (!nextName || nextName === file.name) return
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name: nextName } : f)))
  }

  const handleChangeActiveFileContent = (value: string) => {
    if (!activeFile) return
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? { ...f, content: value } : f))
    )
  }

  const copyActiveFileToClipboard = async () => {
    if (!activeFile?.content) return
    try {
      await navigator.clipboard.writeText(activeFile.content)
      toast.success(`Copied ${activeFile.name} to clipboard`)
    } catch (err) {
      console.error(err)
      toast.error("Couldn't copy to clipboard")
    }
  }

  const downloadActiveFile = () => {
    if (!activeFile) return
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = activeFile.name || "file.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Downloading ${activeFile.name}`)
  }

  // auto-scroll after output appends
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" })
  }, [output, loading])

  // keyboard shortcut: Cmd/Ctrl + Enter
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isEnter = e.key === "Enter"
      const meta = e.metaKey || e.ctrlKey
      if (isEnter && meta) {
        e.preventDefault()
        if (!loading) handleGenerate()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, language, filename, loading])

  // global mouse/touch events for TERMINAL resize
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizing) return
      if (resizeStartY.current == null || resizeStartHeight.current == null) return
      const delta = resizeStartY.current - e.clientY
      const newHeight = Math.max(
        120,
        Math.min(window.innerHeight - 120, resizeStartHeight.current + delta)
      )
      setTerminalHeight(newHeight)
    }
    function onMouseUp() {
      if (isResizing) {
        setIsResizing(false)
        resizeStartY.current = null
        resizeStartHeight.current = null
      }
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [isResizing])

  // global mouse/touch events for EDITOR resize
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isResizingEditor) return
      if (
        editorResizeStartY.current == null ||
        editorResizeStartHeight.current == null
      )
        return
      const delta = editorResizeStartY.current - e.clientY
      const nextHeight = Math.max(
        180,
        Math.min(window.innerHeight - 180, editorResizeStartHeight.current + delta)
      )
      setEditorHeight(nextHeight)
    }
    function onMouseUp() {
      if (isResizingEditor) {
        setIsResizingEditor(false)
        editorResizeStartY.current = null
        editorResizeStartHeight.current = null
      }
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [isResizingEditor])

  const sanitizeFilename = (name: string, ext: string) => {
    if (!name) return `generated.${ext}`
    const safe = name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
    return safe.endsWith(`.${ext}`) ? safe : `${safe}.${ext}`
  }

  // ---------- CORE: generate handler ----------
  const handleGenerate = useCallback(
    async () => {
      if (!prompt.trim()) {
        toast.error("Please enter a prompt")
        return
      }

      setShowTerminal(true)
      setLoading(true)
      setOutput("")
      stopRef.current = false

      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller

      try {
        const maybeResult: GenerateCodeStreamResult = await generateCodeStream({
          prompt: prompt.trim(),
          language,
          filename: filename || undefined,
          signal: controller.signal as any,
        })

        const streamOutput = maybeResult.output
        let usedReadStreamable = false

        try {
          if (typeof readStreamableValue === "function") {
            for await (const chunk of readStreamableValue(streamOutput)) {
              if (stopRef.current) break
              if (!chunk) continue
              setOutput((prev) => {
                const next = prev + chunk
                setTimeout(
                  () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                  0
                )
                return next
              })
            }
            usedReadStreamable = true
          }
        } catch (e) {
          console.warn("readStreamableValue failed, falling back. error:", e)
          usedReadStreamable = false
        }

        if (!usedReadStreamable) {
          if (
            streamOutput &&
            typeof (streamOutput as AsyncIterable<string>)[Symbol.asyncIterator] ===
              "function"
          ) {
            for await (const chunk of streamOutput as AsyncIterable<string>) {
              if (stopRef.current) break
              if (!chunk) continue
              setOutput((prev) => {
                const next = prev + chunk
                setTimeout(
                  () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                  0
                )
                return next
              })
            }
          } else if (
            streamOutput &&
            typeof (streamOutput as ReadableStream) === "object" &&
            (streamOutput as ReadableStream).getReader
          ) {
            const reader = (streamOutput as ReadableStream<Uint8Array>).getReader()
            const decoder = new TextDecoder()
            while (true) {
              const { done, value } = await reader.read()
              if (done || stopRef.current) break
              if (value) {
                const text = decoder.decode(value)
                setOutput((prev) => {
                  const next = prev + text
                  setTimeout(
                    () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                    0
                  )
                  return next
                })
              }
            }
          } else {
            if (typeof streamOutput === "string") {
              setOutput(streamOutput)
              setTimeout(
                () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
                0
              )
            } else {
              console.warn(
                "generateCodeStream produced no readable output shape:",
                streamOutput
              )
              setOutput(
                "// No stream received. Check server logs or adjust server/client stream handling.\n"
              )
            }
          }
        }

        if (!stopRef.current) toast.success("Generation complete")
      } catch (err: any) {
        if ((err && err.name === "AbortError") || controller.signal.aborted) {
          toast.info("Generation aborted")
        } else {
          console.error("Generation failure:", err)
          toast.error("Generation failed")
          setOutput(
            (prev) => prev + `\n// Error: ${err?.message ?? String(err)}`
          )
        }
      } finally {
        setLoading(false)
        controllerRef.current = null
      }
    },
    [prompt, language, filename]
  )

  const handleStop = useCallback(() => {
    stopRef.current = true
    setLoading(false)
    try {
      controllerRef.current?.abort()
    } catch {
      /* ignore */
    }
    toast.info("Generation stopped")
  }, [])

  const copyToClipboard = useCallback(
    async () => {
      if (!output) return
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(output)
          setCopied(true)
          toast.success("Copied to clipboard")
          setTimeout(() => setCopied(false), 2000)
        } catch (err) {
          console.error("Clipboard failed", err)
          toast.error("Couldn't copy to clipboard")
        }
      } else {
        try {
          const ta = document.createElement("textarea")
          ta.value = output
          document.body.appendChild(ta)
          ta.select()
          document.execCommand("copy")
          document.body.removeChild(ta)
          setCopied(true)
          toast.success("Copied to clipboard")
          setTimeout(() => setCopied(false), 2000)
        } catch {
          toast.error("Clipboard not supported")
        }
      }
    },
    [output]
  )

  const downloadFile = useCallback(
    () => {
      if (!output) return
      const ext = currentLangInfo.extension || "txt"
      const name = sanitizeFilename(filename || `generated`, ext)
      const blob = new Blob([output], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Download started")
    },
    [output, filename, currentLangInfo]
  )

  // resize helpers (terminal)
  const onResizeStart = (clientY: number) => {
    setIsResizing(true)
    resizeStartY.current = clientY
    resizeStartHeight.current = terminalHeight
  }
  const onHandleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onResizeStart(e.clientY)
  }
  const onHandleTouchStart = (e: React.TouchEvent) => {
    onResizeStart(e.touches[0].clientY)
  }
  const onHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setTerminalHeight((h) =>
        Math.max(120, Math.min(window.innerHeight - 120, h + 24))
      )
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setTerminalHeight((h) =>
        Math.max(120, Math.min(window.innerHeight - 120, h - 24))
      )
    } else if (e.key === "Home") {
      e.preventDefault()
      setTerminalHeight(Math.min(800, window.innerHeight - 120))
    } else if (e.key === "End") {
      e.preventDefault()
      setTerminalHeight(200)
    }
  }

  // editor resize helpers
  const onEditorResizeStart = (clientY: number) => {
    setIsResizingEditor(true)
    editorResizeStartY.current = clientY
    editorResizeStartHeight.current = editorHeight
  }
  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onEditorResizeStart(e.clientY)
  }
  const onEditorTouchStart = (e: React.TouchEvent) => {
    onEditorResizeStart(e.touches[0].clientY)
  }
  const onEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setEditorHeight((h) =>
        Math.max(180, Math.min(window.innerHeight - 180, h + 24))
      )
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setEditorHeight((h) =>
        Math.max(180, Math.min(window.innerHeight - 180, h - 24))
      )
    } else if (e.key === "Home") {
      e.preventDefault()
      setEditorHeight(Math.min(900, window.innerHeight - 180))
    } else if (e.key === "End") {
      e.preventDefault()
      setEditorHeight(220)
    }
  }

  const onClearOutput = () => setOutput("")
  const onCloseTerminal = () => setShowTerminal(false)

  // sync textarea + highlight scroll
  const handleEditorScroll = () => {
    if (editorTextareaRef.current && editorHighlightRef.current) {
      editorHighlightRef.current.scrollTop = editorTextareaRef.current.scrollTop
      editorHighlightRef.current.scrollLeft = editorTextareaRef.current.scrollLeft
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-8"
        >
          <div className="flex justify-center">
            <TabsList className="grid grid-cols-2 w-[300px] p-1 bg-muted/50 backdrop-blur-sm border rounded-full">
              <TabsTrigger
                value="generate"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Generator
              </TabsTrigger>
              <TabsTrigger
                value="editor"
                className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Editor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Project Context Card */}
          {project && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-medium text-sm">
                        Using repository context
                      </p>
                      <p className="text-xs text-muted-foreground">
                        AI has access to {project.name}&apos;s codebase for
                        context-aware generation
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-white/50 dark:bg-slate-800/50"
                  >
                    RAG Enabled
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* GENERATE TAB */}
          <TabsContent value="generate" className="space-y-6 outline-none">
            <div className="grid lg:grid-cols-5 gap-6 items-start">
              <Card className="lg:col-span-2 border-0 shadow-lg bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Language
                    </label>
                    <Select
                      value={language}
                      onValueChange={(val) => {
                        setLanguage(val)
                      }}
                    >
                      <SelectTrigger className="h-10 border-muted-foreground/20 focus:ring-blue-500/20 focus:border-blue-500">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full",
                              currentLangInfo.color.replace("text-", "bg-") ||
                                "bg-gray-400"
                            )}
                          />
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGE_OPTIONS.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Filename
                    </label>
                    <Input
                      className="h-10 font-mono text-sm border-muted-foreground/20 focus:ring-blue-500/20 focus:border-blue-500"
                      placeholder={`app.${currentLangInfo.extension}`}
                      value={filename}
                      onChange={(e) => setFilename(e.target.value)}
                      aria-label="filename"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="lg:col-span-3 space-y-6">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur" />
                  <Card className="relative border-0 shadow-xl bg-background">
                    <CardContent className="p-4">
                      <Textarea
                        ref={textareaRef}
                        placeholder="Describe exactly what you want to build..."
                        className="min-h-[160px] resize-none border-0 focus-visible:ring-0 p-2 text-base leading-relaxed placeholder:text-muted-foreground/50"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        aria-label="generation prompt"
                      />
                      <div className="flex justify-between items-center pt-4 border-t mt-2">
                        <span className="text-xs text-muted-foreground pl-2">
                          {prompt.length} characters
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPrompt("")}
                            disabled={!prompt || loading}
                            className="text-muted-foreground hover:text-foreground"
                            aria-disabled={!prompt || loading}
                          >
                            <Eraser className="w-4 h-4 mr-2" /> Clear
                          </Button>
                          {loading ? (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={handleStop}
                              className="shadow-md"
                            >
                              <StopCircle className="w-4 h-4 mr-2" /> Stop
                            </Button>
                          ) : (
                            <Button
                              onClick={handleGenerate}
                              disabled={!prompt.trim()}
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-[1.02]"
                              aria-disabled={!prompt.trim()}
                            >
                              <Sparkles className="w-4 h-4 mr-2" /> Generate Code
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* TERMINAL FULL WIDTH BELOW GRID */}
            {showTerminal && (
              <div
                className="w-full animate-in fade-in slide-in-from-bottom-8 duration-500 mt-2 transition-all ease-out"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="rounded-xl overflow-hidden border shadow-2xl bg-[#1e1e1e] w-full">
                  <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#333]">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                      </div>
                      <div className="text-xs text-gray-400 font-mono flex items-center gap-2">
                        {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                        {filename || `script.${currentLangInfo.extension}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearOutput}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Eraser className="w-4 h-4 mr-2" /> Clear
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={copyToClipboard}
                        aria-label="copy code"
                      >
                        {copied ? (
                          <Check className="w-3.5 h-3.5 text-green-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={downloadFile}
                        aria-label="download code"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onCloseTerminal}
                        aria-label="close terminal"
                        className="h-6 w-6 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Resize handle */}
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    tabIndex={0}
                    onMouseDown={onHandleMouseDown}
                    onTouchStart={onHandleTouchStart}
                    onKeyDown={onHandleKeyDown}
                    className={cn(
                      "h-3 cursor-row-resize bg-transparent hover:bg-white/5 transition-colors",
                      isResizing ? "bg-white/8" : "bg-transparent"
                    )}
                    title="Drag to resize terminal height (or use ↑ ↓ keys)"
                  >
                    <div className="mx-auto w-16 h-0.5 rounded bg-white/20 mt-1" />
                  </div>

                  {/* Code area */}
                  <div
                    className="relative group overflow-auto custom-scrollbar transition-[height] duration-300 ease-out"
                    style={{ height: `${terminalHeight}px` }}
                  >
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: "1.5rem",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        background: "transparent",
                        fontFamily:
                          '"JetBrains Mono", "Fira Code", monospace',
                      }}
                      showLineNumbers
                      wrapLines
                    >
                      {output ||
                        (loading
                          ? ""
                          : "// No output yet — generate code to view it here")}
                    </SyntaxHighlighter>

                    <div ref={bottomRef} />

                    {loading && (
                      <div className="px-4 pb-4">
                        <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse align-middle" />
                      </div>
                    )}
                  </div>

                  <div className="bg-[#007acc] text-white px-3 py-1 text-[10px] flex justify-between font-sans">
                    <span>{language.toUpperCase()}</span>
                    <span>
                      Ln {Math.max(1, output.split("\n").length)}, Col{" "}
                      {Math.max(
                        0,
                        (output.split("\n").pop() ?? "").length
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* EDITOR TAB */}
          <TabsContent
            value="editor"
            className="animate-in fade-in slide-in-from-right-4 duration-300 outline-none"
          >
            <Card className="max-w-5xl mx-auto border-0 shadow-lg bg-background/80 backdrop-blur-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-blue-500" />
                  </CardTitle>
                 
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] px-2 py-1"
                >
                  {currentLangInfo.label} mode
                </Badge>
              </CardHeader>

              <CardContent className="flex flex-col md:flex-row gap-4">
                {/* FILE SIDEBAR */}
                <aside className="w-full md:w-52 lg:w-56 border rounded-lg bg-muted/40 flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <FileText className="w-3 h-3" />
                      Files
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCreateFile}
                      aria-label="Create new file"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1 overflow-auto py-1">
                    {files.map((file) => {
                      const isActive = activeFile?.id === file.id
                      return (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => setActiveFileId(file.id)}
                          className={cn(
                            "w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs hover:bg-muted/80 transition-colors",
                            isActive && "bg-primary/10 text-primary"
                          )}
                        >
                          <span className="truncate font-mono">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRenameFile(file.id)
                            }}
                            className="p-0.5 text-muted-foreground hover:text-foreground"
                            aria-label={`Rename ${file.name}`}
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </button>
                      )
                    })}

                    {files.length === 0 && (
                      <div className="px-3 py-4 text-xs text-muted-foreground">
                        No files yet. Create one to get started.
                      </div>
                    )}
                  </div>
                </aside>

                {/* EDITOR AREA */}
                <section className="flex-1 flex flex-col gap-2">
                  {/* Toolbar */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Editing
                      </span>
                      <span className="font-mono text-sm">
                        {activeFile?.name ?? "No file selected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={copyActiveFileToClipboard}
                        disabled={!activeFile}
                        aria-label="Copy file to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={downloadActiveFile}
                        disabled={!activeFile}
                        aria-label="Download file"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Editor with syntax highlighting + resize */}
                  <div
                    className="relative border rounded-lg bg-[#1e1e1e] overflow-hidden shadow-inner"
                    style={{ height: `${editorHeight}px` }}
                  >
                    {/* Top bar (like VS Code tab strip) */}
                    <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#333]">
                      <div className="flex items-center gap-2 text-xs text-gray-300 font-mono">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-[#ff5f56]" />
                          <span className="w-2 h-2 rounded-full bg-[#ffbd2e]" />
                          <span className="w-2 h-2 rounded-full bg-[#27c93f]" />
                        </div>
                        <span>{activeFile?.name ?? "untitled"}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {currentLangInfo.label}
                      </span>
                    </div>

                    {/* Highlight + editable layer */}
                    <div className="relative w-full h-full">
                      {/* Highlight layer */}
                      <div
                        ref={editorHighlightRef}
                        className="absolute inset-0 overflow-auto custom-scrollbar pointer-events-none"
                      >
                        <SyntaxHighlighter
                          language={language}
                          style={vscDarkPlus}
                          customStyle={{
                            margin: 0,
                            padding: "0.75rem 1rem 1rem",
                            fontSize: "0.9rem",
                            lineHeight: "1.6",
                            background: "transparent",
                            fontFamily:
                              '"JetBrains Mono","Fira Code",monospace',
                          }}
                          showLineNumbers
                          wrapLongLines
                        >
                          {activeFile?.content ||
                            "// Create or select a file to start editing."}
                        </SyntaxHighlighter>
                      </div>

                      {/* Transparent textarea on top */}
                      {activeFile ? (
                        <textarea
                          ref={editorTextareaRef}
                          value={activeFile.content}
                          onChange={(e) =>
                            handleChangeActiveFileContent(e.target.value)
                          }
                          onScroll={handleEditorScroll}
                          spellCheck={false}
                          className={cn(
                            "absolute inset-0 w-full h-full resize-none border-none outline-none",
                            "bg-transparent text-transparent caret-white",
                            "font-mono text-sm leading-relaxed p-3 pl-11", // padding to align with line numbers
                            "whitespace-pre"
                          )}
                          aria-label="Code editor"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
                          Create or select a file to start editing.
                        </div>
                      )}
                    </div>

                    {/* Footer bar */}
                    <div className="absolute bottom-0 left-0 right-0 bg-[#007acc] text-white px-3 py-1 text-[10px] flex justify-between font-sans">
                      <span>{language.toUpperCase()}</span>
                      <span className="font-mono">
                        {activeFile
                          ? `${activeFile.content.split("\n").length} lines`
                          : "0 lines"}
                      </span>
                    </div>
                  </div>

                  {/* Resize handle for editor */}
                  <div
                    role="separator"
                    aria-orientation="horizontal"
                    tabIndex={0}
                    onMouseDown={onEditorMouseDown}
                    onTouchStart={onEditorTouchStart}
                    onKeyDown={onEditorKeyDown}
                    className={cn(
                      "h-3 cursor-row-resize bg-transparent hover:bg-muted/60 rounded-b-md transition-colors",
                      isResizingEditor && "bg-muted"
                    )}
                    title="Drag to resize editor height (or use ↑ ↓ keys)"
                  >
                    <div className="mx-auto w-16 h-0.5 rounded bg-muted-foreground/40 mt-1" />
                  </div>
                </section>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
