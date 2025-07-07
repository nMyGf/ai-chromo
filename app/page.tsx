"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Upload, Zap, Eye, CheckCircle, Download, Dna, FolderOpen, Images, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProcessedImage {
  id: string
  originalImage: string
  enhancedImage: string
  detectionText: string
  confidence: number
  fileName: string
}

export default function ImageAnalysisInterface() {
  const [uploadedImages, setUploadedImages] = useState<Array<{ id: string; src: string; name: string; size: number }>>(
    [],
  )
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [results, setResults] = useState<ProcessedImage[]>([])
  const [surveyAnswers, setSurveyAnswers] = useState<{
    uploadProcess: string
    karyotypeResult: string
    imageQuality: string
  }>({
    uploadProcess: "",
    karyotypeResult: "",
    imageQuality: "",
  })
  const [showSurvey, setShowSurvey] = useState(true)
  const [disclaimerAgreed, setDisclaimerAgreed] = useState(false)
  const [uploadMethod, setUploadMethod] = useState<"file" | "drag">("file")
  const [isDragOver, setIsDragOver] = useState(false)
  const [totalSize, setTotalSize] = useState(0)
  const [disclaimerWarning, setDisclaimerWarning] = useState(false)
  const disclaimerRef = useRef<HTMLDivElement>(null)

  const MAX_SIZE = 5 * 1024 * 1024 // 5MB in bytes for both options

  useEffect(() => {
    if (results.length > 0) {
      const timer = setTimeout(() => {
        setShowSurvey(true)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setShowSurvey(false)
    }
  }, [results])

  const validateFileSize = (newFiles: File[], existingSize = 0) => {
    const newFilesSize = newFiles.reduce((sum, file) => sum + file.size, 0)
    return newFilesSize + existingSize <= MAX_SIZE
  }

  const processImageFiles = (files: File[], isAdditive = false) => {
    const jpgFiles = files.filter((file) => file.type === "image/jpeg")
    if (jpgFiles.length === 0) {
      alert("No JPG files found. Please upload only JPG images.")
      return
    }

    const currentSize = isAdditive ? totalSize : 0
    if (!validateFileSize(jpgFiles, currentSize)) {
      const remainingSize = MAX_SIZE - currentSize
      alert(`Total file size would exceed 5MB limit. You have ${formatFileSize(remainingSize)} remaining space.`)
      return
    }

    const newImages: Array<{ id: string; src: string; name: string; size: number }> = []
    let loadedCount = 0

    jpgFiles.forEach((file, index) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        newImages.push({
          id: `img-${Date.now()}-${index}`,
          src: e.target?.result as string,
          name: file.name,
          size: file.size,
        })
        loadedCount++

        if (loadedCount === jpgFiles.length) {
          if (isAdditive) {
            // Add to existing images
            setUploadedImages((prev) => [...prev, ...newImages])
            setTotalSize((prev) => prev + jpgFiles.reduce((sum, file) => sum + file.size, 0))
          } else {
            // Replace existing images
            setUploadedImages(newImages)
            setTotalSize(jpgFiles.reduce((sum, file) => sum + file.size, 0))
          }
          setResults([])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!disclaimerAgreed) {
      handleDisclaimerBypass()
      return
    }

    const files = Array.from(event.target.files || [])
    if (files.length === 0) {
      alert("No files found in the selected folder.")
      return
    }

    processImageFiles(files, false) // Replace existing images for folder upload
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (!disclaimerAgreed) {
        handleDisclaimerBypass()
        return
      }

      const files = Array.from(e.dataTransfer.files)
      processImageFiles(files, true) // Add to existing images for drag & drop
    },
    [totalSize, disclaimerAgreed],
  )

  const removeImage = (imageId: string) => {
    setUploadedImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId)
      if (imageToRemove) {
        setTotalSize((prevSize) => prevSize - imageToRemove.size)
      }
      return prev.filter((img) => img.id !== imageId)
    })
    setResults([])
  }

  const clearAllImages = () => {
    setUploadedImages([])
    setTotalSize(0)
    setResults([])
  }

  const processImages = async () => {
    if (uploadedImages.length === 0) return

    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing with progress updates
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 100 / uploadedImages.length / 10
      })
    }, 200)

    // Simulate API call delay for each image
    setTimeout(() => {
      const processedResults: ProcessedImage[] = uploadedImages.map((img, index) => ({
        id: img.id,
        originalImage: img.src,
        enhancedImage: img.src, // In real implementation, this would be the enhanced image
        detectionText: `Image ${index + 1} Analysis: Detected chromosomes: ${20 + Math.floor(Math.random() * 6)} pairs identified (${85 + Math.floor(Math.random() * 15)}% confidence), Karyotype analysis complete (${80 + Math.floor(Math.random() * 20)}% confidence), ${Math.random() > 0.5 ? "Normal karyotype detected" : "Potential abnormalities detected"}. Image quality enhanced with noise reduction and contrast optimization specifically for genetic material visualization.`,
        confidence: 85 + Math.floor(Math.random() * 15),
        fileName: img.name,
      }))

      setResults(processedResults)
      setIsProcessing(false)
      clearInterval(progressInterval)
    }, 3000)
  }

  const handleSurveyChange = (question: string, value: string) => {
    setSurveyAnswers((prev) => ({
      ...prev,
      [question]: value,
    }))
  }

  const submitSurvey = () => {
    console.log("Survey submitted:", surveyAnswers)
    alert("Thank you for your feedback!")
  }

  const downloadImage = (imageData: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = imageData
    link.download = `enhanced-${fileName}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(2) + " KB"
    }
    return (bytes / (1024 * 1024)).toFixed(2) + " MB"
  }

  const handleUploadAreaClick = (e: React.MouseEvent) => {
    if (!disclaimerAgreed) {
      e.preventDefault()
      e.stopPropagation()
      handleDisclaimerBypass()
      return false
    }
  }

  const handleDisclaimerBypass = () => {
    setDisclaimerWarning(true)
    // Scroll to disclaimer with better positioning
    setTimeout(() => {
      disclaimerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      })
    }, 100)
    // Add pulse animation after scroll
    setTimeout(() => {
      disclaimerRef.current?.classList.add("animate-pulse")
      setTimeout(() => {
        disclaimerRef.current?.classList.remove("animate-pulse")
      }, 2000)
    }, 800)
  }

  const getRemainingSize = () => {
    return MAX_SIZE - totalSize
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Sticky Header with Logos */}
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* ChromaVision AI Logo - Left */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Dna className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    ChromaVision AI
                  </h1>
                  <p className="text-sm text-gray-600">Chromosome Analysis & Detection</p>
                </div>
              </div>
              {/* KSU Logo - Right */}
              <div className="flex items-center gap-4">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202025-06-30%20at%2012.12.02-Fkg7VhCwId8BuY0rxL4RVj5R3vsBNl.jpeg"
                  alt="King Saud University Logo"
                  className="h-16 w-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title Section */}
        <div className="px-4 pt-4">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold text-blue-900 leading-tight">
                ARTIFICIAL INTELLIGENCE (AI) BASED APPROACH TO IMPROVE DETECTION OF GENOMIC ABNORMALITIES ASSOCIATED
                WITH HEMATOLOGICAL MALIGNANCIES
              </h2>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer Section */}
        <div className="px-4">
          <Card
            className={`${
              disclaimerWarning
                ? "border-red-500 bg-red-50/70 shadow-lg shadow-red-200 ring-2 ring-red-300 ring-opacity-50"
                : "border-amber-200 bg-amber-50/50"
            } transition-all duration-500`}
            ref={disclaimerRef}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 ${disclaimerWarning ? "bg-red-500" : "bg-amber-500"} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300`}
                >
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div className="space-y-4">
                  <h3
                    className={`font-semibold ${disclaimerWarning ? "text-red-800" : "text-amber-800"} transition-colors duration-300`}
                  >
                    {disclaimerWarning ? "Please Read and Accept Disclaimer" : "Disclaimer"}
                  </h3>
                  <p
                    className={`text-sm ${disclaimerWarning ? "text-red-700" : "text-amber-700"} leading-relaxed transition-colors duration-300`}
                  >
                    This platform is for research and educational purposes only. The results provided are not certified
                    for clinical use and do not replace professional medical diagnosis. By uploading images, you
                    confirm:
                  </p>
                  <ul
                    className={`text-sm ${disclaimerWarning ? "text-red-700" : "text-amber-700"} leading-relaxed ml-4 space-y-1 transition-colors duration-300`}
                  >
                    <li>• You have the right and permission to use the data.</li>
                    <li>• The images contain no personally identifiable information (PII).</li>
                    <li>• I confirm that all uploaded images belong to one patient.</li>
                  </ul>
                  <div
                    className={`flex items-center space-x-3 p-3 bg-white/50 rounded-lg border ${disclaimerWarning ? "border-red-400 bg-red-50/50" : "border-amber-300"} transition-all duration-300`}
                  >
                    <input
                      type="checkbox"
                      id="disclaimer-agreement"
                      checked={disclaimerAgreed}
                      onChange={(e) => {
                        setDisclaimerAgreed(e.target.checked)
                        if (e.target.checked) {
                          setDisclaimerWarning(false)
                        }
                      }}
                      className={`w-4 h-4 ${disclaimerWarning ? "text-red-600 border-red-400 focus:ring-red-500" : "text-amber-600 border-amber-300 focus:ring-amber-500"} bg-white rounded focus:ring-2 transition-colors duration-300`}
                    />
                    <Label
                      htmlFor="disclaimer-agreement"
                      className={`text-sm font-medium ${disclaimerWarning ? "text-red-800" : "text-amber-800"} cursor-pointer transition-colors duration-300`}
                    >
                      I agree to the disclaimer and terms of use.
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content with Top Padding */}
        <div className="pt-8"></div>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Karyogram
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as "file" | "drag")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Select Folder
                  </TabsTrigger>
                  <TabsTrigger value="drag" className="flex items-center gap-2">
                    <Images className="w-4 h-4" />
                    Drag & Drop
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      disclaimerAgreed ? "border-gray-300 hover:border-blue-400" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Input
                      type="file"
                      onChange={handleFolderUpload}
                      className="hidden"
                      id="folder-upload"
                      disabled={!disclaimerAgreed}
                      {...({ webkitdirectory: "" } as any)}
                      multiple
                    />
                    <Label
                      htmlFor="folder-upload"
                      className={`cursor-pointer ${!disclaimerAgreed ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={handleUploadAreaClick}
                    >
                      <div className="space-y-4">
                        <FolderOpen className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <p className="text-lg font-medium">
                            {disclaimerAgreed ? "Select Folder with JPG Images" : "Please agree to disclaimer first"}
                          </p>
                          <p className="text-sm text-gray-500">Folder containing JPG images | Max total size: 5MB</p>
                        </div>
                      </div>
                    </Label>
                  </div>
                </TabsContent>

                <TabsContent value="drag" className="space-y-4">
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? "border-blue-500 bg-blue-50"
                        : disclaimerAgreed
                          ? "border-gray-300 hover:border-blue-400"
                          : "border-gray-200 bg-gray-50"
                    }`}
                    onDragOver={disclaimerAgreed ? handleDragOver : undefined}
                    onDragLeave={disclaimerAgreed ? handleDragLeave : undefined}
                    onDrop={disclaimerAgreed ? handleDrop : undefined}
                    onClick={handleUploadAreaClick}
                  >
                    <div className="space-y-4">
                      <Images className="w-12 h-12 mx-auto text-gray-400" />
                      <div>
                        <p className="text-lg font-medium">
                          {disclaimerAgreed
                            ? uploadedImages.length > 0
                              ? "Drop More JPG Images Here"
                              : "Drag & Drop JPG Images Here"
                            : "Please agree to disclaimer first"}
                        </p>
                        <p className="text-sm text-gray-500">
                          Multiple JPG files | Remaining space: {formatFileSize(getRemainingSize())}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {uploadedImages.length} image{uploadedImages.length > 1 ? "s" : ""} uploaded
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-500">Total: {formatFileSize(totalSize)}</p>
                      {uploadMethod === "drag" && (
                        <Button
                          onClick={clearAllImages}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 bg-transparent"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {uploadedImages.map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.src || "/placeholder.svg"}
                          alt={img.name}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <Badge className="absolute top-1 right-1 bg-green-500 text-xs">
                          <CheckCircle className="w-2 h-2 mr-1" />
                          Ready
                        </Badge>
                        {uploadMethod === "drag" && (
                          <Button
                            onClick={() => removeImage(img.id)}
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 left-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        <div className="absolute bottom-1 left-1 right-1">
                          <p className="text-xs text-white bg-black/50 rounded px-1 truncate">{img.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button onClick={processImages} disabled={isProcessing} className="w-full" size="lg">
                    <Zap className="w-4 h-4 mr-2" />
                    {isProcessing ? "Processing..." : `Enhance & Detect (${uploadedImages.length} images)`}
                  </Button>
                  {isProcessing && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing images...</span>
                        <span>{Math.round(processingProgress)}%</span>
                      </div>
                      <Progress value={processingProgress} className="w-full" />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results.length > 0 ? (
                <div className="space-y-8 max-h-96 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={result.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">
                          Image {index + 1}: {result.fileName}
                        </h3>
                        <Badge variant="outline">{result.confidence}% Confidence</Badge>
                      </div>
                      {/* Enhanced Image */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Enhanced Image</h4>
                          <Button
                            onClick={() => downloadImage(result.enhancedImage, result.fileName)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </Button>
                        </div>
                        <div className="relative">
                          <img
                            src={result.enhancedImage || "/placeholder.svg"}
                            alt={`Enhanced ${result.fileName}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Badge className="absolute top-2 right-2 bg-blue-500">Enhanced</Badge>
                        </div>
                      </div>
                      {/* Detection Analysis */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium">Detection Analysis</h4>
                          <Button
                            onClick={() => {
                              const blob = new Blob([result.detectionText], { type: "text/plain" })
                              const url = URL.createObjectURL(blob)
                              const link = document.createElement("a")
                              link.href = url
                              link.download = `analysis-${result.fileName.replace(".jpg", ".txt")}`
                              document.body.appendChild(link)
                              link.click()
                              document.body.removeChild(link)
                              URL.revokeObjectURL(url)
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="w-3 h-3" />
                            Report
                          </Button>
                        </div>
                        <Textarea value={result.detectionText} readOnly className="min-h-[80px] resize-none text-sm" />
                      </div>
                      {index < results.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Upload and process images to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Survey Section - Always Visible */}
        <div className="px-4">
          <Card className="mt-8 border-2 border-blue-200 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Assessment of Service Effectiveness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-3 gap-8">
                {/* Question 1 */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Was the image upload process quick and easy?
                  </Label>
                  <RadioGroup
                    value={surveyAnswers.uploadProcess}
                    onValueChange={(value) => handleSurveyChange("uploadProcess", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="yes" id="satisfied-yes" className="text-blue-600" />
                      <Label htmlFor="satisfied-yes" className="cursor-pointer font-medium">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="no" id="satisfied-no" className="text-blue-600" />
                      <Label htmlFor="satisfied-no" className="cursor-pointer font-medium">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Question 2 */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Did the karyotype result help you in understanding the sample better?
                  </Label>
                  <RadioGroup
                    value={surveyAnswers.karyotypeResult}
                    onValueChange={(value) => handleSurveyChange("karyotypeResult", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="yes" id="accurate-yes" className="text-blue-600" />
                      <Label htmlFor="accurate-yes" className="cursor-pointer font-medium">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="no" id="accurate-no" className="text-blue-600" />
                      <Label htmlFor="accurate-no" className="cursor-pointer font-medium">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Question 3 */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Were you satisfied with the overall quality of the processed image?
                  </Label>
                  <RadioGroup
                    value={surveyAnswers.imageQuality}
                    onValueChange={(value) => handleSurveyChange("imageQuality", value)}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="yes" id="recommend-yes" className="text-blue-600" />
                      <Label htmlFor="recommend-yes" className="cursor-pointer font-medium">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                      <RadioGroupItem value="no" id="recommend-no" className="text-blue-600" />
                      <Label htmlFor="recommend-no" className="cursor-pointer font-medium">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              <div className="flex justify-center pt-6">
                <Button
                  onClick={submitSurvey}
                  disabled={
                    !surveyAnswers.uploadProcess || !surveyAnswers.karyotypeResult || !surveyAnswers.imageQuality
                  }
                  className="px-12 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  Submit Feedback
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
