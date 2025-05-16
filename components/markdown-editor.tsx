"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Bold, Italic, List, ListOrdered, ImageIcon, Link, Code, Heading1, Heading2, FileIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  onAttachmentUpload?: (files: File[]) => Promise<
    Array<{
      name: string
      url: string
      type: string
      publicId?: string
    }>
  >
}

export function MarkdownEditor({ value, onChange, onAttachmentUpload }: MarkdownEditorProps) {
  const { toast } = useToast()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const insertText = (before: string, after = "") => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)

    onChange(newText)

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + before.length + selectedText.length + after.length,
        start + before.length + selectedText.length + after.length,
      )
    }, 0)
  }

  const handleBold = () => insertText("**", "**")
  const handleItalic = () => insertText("*", "*")
  const handleUnorderedList = () => insertText("- ")
  const handleOrderedList = () => insertText("1. ")
  const handleHeading1 = () => insertText("# ")
  const handleHeading2 = () => insertText("## ")
  const handleCode = () => insertText("```\n", "\n```")

  const handleLink = () => {
    const url = prompt("Entrez l'URL:")
    const text = prompt("Entrez le texte du lien:") || url
    if (url) {
      insertText(`[${text}](${url})`)
    }
  }

  const handleImageUpload = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !onAttachmentUpload) return

    setIsUploading(true)
    try {
      const fileArray = Array.from(files)
      const uploadedFiles = await onAttachmentUpload(fileArray)

      uploadedFiles.forEach((file) => {
        const isImage = file.type.startsWith("image/")
        if (isImage) {
          insertText(`![${file.name}](${file.url})`)
        } else {
          insertText(`[${file.name}](${file.url})`)
        }
      })

      toast({
        title: "Téléchargement réussi",
        description: `${uploadedFiles.length} fichier(s) téléchargé(s)`,
      })
    } catch (error) {
      // toast({
      //   title: "Erreur",
      //   description: "Échec du téléchargement du fichier",
      //   variant: "destructive",
      // })
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-md">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleBold}>
                <Bold className="h-4 w-4" />
                <span className="sr-only">Gras</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gras (Ctrl+B)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleItalic}>
                <Italic className="h-4 w-4" />
                <span className="sr-only">Italique</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Italique (Ctrl+I)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleHeading1}>
                <Heading1 className="h-4 w-4" />
                <span className="sr-only">Titre 1</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Titre 1</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleHeading2}>
                <Heading2 className="h-4 w-4" />
                <span className="sr-only">Titre 2</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Titre 2</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleUnorderedList}>
                <List className="h-4 w-4" />
                <span className="sr-only">Liste à puces</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Liste à puces</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleOrderedList}>
                <ListOrdered className="h-4 w-4" />
                <span className="sr-only">Liste numérotée</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Liste numérotée</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLink}>
                <Link className="h-4 w-4" />
                <span className="sr-only">Lien</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insérer un lien</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCode}>
                <Code className="h-4 w-4" />
                <span className="sr-only">Code</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Bloc de code</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImageUpload}
                disabled={isUploading || !onAttachmentUpload}
              >
                <ImageIcon className="h-4 w-4" />
                <span className="sr-only">Image</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Insérer une image</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleImageUpload}
                disabled={isUploading || !onAttachmentUpload}
              >
                <FileIcon className="h-4 w-4" />
                <span className="sr-only">Pièce jointe</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ajouter une pièce jointe</TooltipContent>
          </Tooltip>

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
        </div>

        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Qu'avez-vous accompli aujourd'hui? (Markdown supporté)"
          rows={8}
          className="font-mono text-sm"
        />
      </div>
    </TooltipProvider>
  )
}
