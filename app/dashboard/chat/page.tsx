"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64 data for small files
}

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  attachments?: FileAttachment[];
  timestamp: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [hasStarted, setHasStarted] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper function to validate and clean base64 data
  const cleanBase64Data = (data: string): string | null => {
    if (!data) return null;
    
    // Remove data URL prefix if present
    const base64Data = data.includes(',') ? data.split(',')[1] : data;
    
    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
      console.error('Invalid base64 format');
      return null;
    }
    
    return base64Data;
  };

  // Helper function to create data URL for Next.js Image
  const createDataUrl = (data: string, mimeType: string): string => {
    if (!data) return '';
    
    // If it's already a data URL, return as is
    if (data.startsWith('data:')) return data;
    
    // Create data URL from base64 data
    return `data:${mimeType};base64,${data}`;
  };

  useEffect(() => {
    let storedSessionId = localStorage.getItem("penguin_session_id");
    if (!storedSessionId) {
      storedSessionId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
      localStorage.setItem("penguin_session_id", storedSessionId);
    }
    setSessionId(storedSessionId);
  }, []);

  // File handling functions
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    // Check total number of files
    if (files.length > 5) {
      toast({
        title: "Too many files",
        description: "Please select up to 5 files at a time.",
        variant: "destructive",
      });
      return;
    }

    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB. Please choose a smaller file.`,
          variant: "destructive",
        });
        return;
      }

      // Check file type - only images allowed
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/jpg'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Unsupported file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: FileAttachment = {
          id: Date.now().toString() + Math.random().toString(36).substring(2),
          name: file.name,
          type: file.type,
          size: file.size,
          data: e.target?.result as string,
        };
        setAttachments(prev => [...prev, attachment]);
        toast({
          title: "File added",
          description: `${file.name} has been added to your message.`,
          variant: "success",
        });
      };
      
      reader.onerror = () => {
        toast({
          title: "File read error",
          description: `Failed to read ${file.name}. Please try again.`,
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    });
  }, [toast]);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };


  const handleSendMessage = async (customInput?: string) => {
    const messageToSend = typeof customInput === "string" ? customInput : input;
    if (messageToSend.trim() === "" && attachments.length === 0) return;
    if (!hasStarted) setHasStarted(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageToSend,
      sender: "user",
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setAttachments([]);
    setIsLoading(true);

    try {
      // Use webhook for AI processing
      const apiEndpoint = "https://n8n-production-4025.up.railway.app/webhook/fitness";

      console.log('🚀 Sending request to webhook:', apiEndpoint);
      console.log('📝 Message:', messageToSend);
      console.log('📎 Attachments:', attachments.length);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatInput: messageToSend,
          files: attachments.length > 0 ? attachments.map(att => {
            if (!att.data) {
              console.error('No data found for file:', att.name);
              return null;
            }
            
            const base64Data = cleanBase64Data(att.data);
            if (!base64Data) {
              console.error('Invalid base64 data for file:', att.name);
              return null;
            }
            
            console.log('Sending file to webhook:', {
              fileName: att.name,
              fileType: att.type,
              fileSize: att.size,
              dataLength: base64Data.length,
              dataPreview: base64Data.substring(0, 50) + '...'
            });
            
            return {
              fileName: att.name,
              fileType: att.type,
              fileSize: att.size,
              data: base64Data
            };
          }).filter(file => file !== null) : [],
          sessionId: sessionId
        }),
      });

      console.log('📡 Webhook response status:', response.status);
      console.log('📡 Webhook response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Webhook error response:", errorText);
        throw new Error(`Webhook error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Webhook response:", data);
      console.log("Response type:", typeof data, "Is array:", Array.isArray(data));
      
      // Handle the webhook response structure
      let responseText = "Sorry, I couldn't get a response.";
      
      if (Array.isArray(data) && data.length > 0) {
        const responseData = data[0];
        
        // Check if this is an image generation response
        if (responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
          const imageData = responseData.data[0];
          if (imageData.b64_json) {
            // This is an image generation response
            responseText = `I've generated an image for you! (${responseData.size || 'unknown size'}, ${responseData.output_format || 'unknown format'})`;
            
            // Add the generated image to the message
            const generatedImage: FileAttachment = {
              id: `generated-${Date.now()}`,
              name: `generated-image-${Date.now()}.${responseData.output_format || 'png'}`,
              type: `image/${responseData.output_format || 'png'}`,
              size: imageData.b64_json.length * 0.75, // Approximate size
              data: imageData.b64_json
            };
            
            const aiMessage: Message = {
              id: Date.now().toString() + "-ai",
              text: responseText,
              sender: "ai",
              timestamp: new Date(),
              attachments: [generatedImage]
            };
            setMessages((prev) => [...prev, aiMessage]);
            return;
          }
        }
        
        // Check for text response in other possible fields
        responseText = responseData.response || responseData.message || responseData.output || responseData.text || responseText;
      } else if (data.response || data.message || data.output || data.text) {
        responseText = data.response || data.message || data.output || data.text;
      }
      
      const aiMessage: Message = {
        id: Date.now().toString() + "-ai",
        text: responseText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      
      let errorText = "Sorry, something went wrong. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Webhook error:')) {
          errorText = `AI service error: ${error.message}`;
        } else if (error.message.includes('Failed to fetch')) {
          errorText = "Unable to connect to the AI service. Please try again later.";
        } else if (attachments.length > 0) {
          errorText = "Error processing your message with images. Please try without images or check image formats.";
        } else {
          errorText = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: "Error",
        description: errorText,
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: Date.now().toString() + "-error",
        text: errorText,
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen">
      {!hasStarted ? (
        <div className="flex flex-1 flex-col items-center justify-center min-h-screen">
          <div className="text-3xl font-semibold mb-8 text-center">Where should we begin?</div>
          <div className="w-full max-w-xl">
            {/* Attachment preview for initial state */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg mb-4">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center gap-2 bg-background rounded px-2 py-1">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm">{attachment.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="h-4 w-4 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div 
              className={`flex w-full items-center space-x-2 p-2 rounded-lg border-2 transition-colors ${
                isDragOver ? 'border-primary bg-primary/5' : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="h-12 w-12 p-0"
              >
                <Upload className="h-5 w-5" />
              </Button>
              
              
              <Input
                id="message-initial"
                placeholder="Ask anything or drag images here..."
                className="flex-1 text-lg py-6 px-4 border-0"
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                style={{ fontSize: "1.25rem" }}
              />
              <Button 
                onClick={() => handleSendMessage()} 
                disabled={isLoading || (input.trim() === "" && attachments.length === 0)} 
                size="lg" 
                className="h-14 w-14 flex items-center justify-center"
              >
                <Send className="h-6 w-6" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Card className="flex relative min-h-[85vh] sm:min-h-[90vh] flex-col w-full mx-auto my-8">
          <CardHeader>
            <CardTitle>PenguinGPT</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="max-h-[60vh] overflow-y-auto sm:pr-4" ref={scrollAreaRef}>
                <div className="space-y-4 p-4">
                  {messages.length === 0 && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg px-4 py-2 max-w-[75%] bg-muted">
                        <span className="text-muted-foreground text-base">Welcome PenguinSwimSchool Coaches & Admin!<br/>Ask anything about classes, scheduling, clients, or coaching tips.</span>
                      </div>
                    </div>
                  )}
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.sender === "user" ? "justify-end" : ""
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[75%] ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.text && <div className="mb-2">{message.text}</div>}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id} className="flex items-center gap-2">
                                {attachment.type.startsWith('image/') ? (
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <ImageIcon className="h-4 w-4" />
                                      <span className="text-sm font-medium">{attachment.name}</span>
                                    </div>
                                    <div className="relative max-w-64 max-h-64 rounded-lg border border-gray-200 overflow-hidden">
                                      <Image
                                        src={createDataUrl(attachment.data || '', attachment.type)}
                                        alt={attachment.name}
                                        width={256}
                                        height={256}
                                        className="object-contain w-full h-full"
                                        style={{ backgroundColor: 'transparent' }}
                                        unoptimized={true}
                                      />
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg px-4 py-2 max-w-[75%] bg-muted">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-3">
              {/* Attachment preview */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 bg-muted rounded-lg">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 bg-background rounded px-2 py-1">
                      <ImageIcon className="h-4 w-4" />
                      <span className="text-sm">{attachment.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        className="h-4 w-4 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Input area */}
              <div 
                className={`flex w-full items-center space-x-2 p-2 rounded-lg border-2 transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-transparent'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                
                
                <Input
                  id="message"
                  placeholder="Type your message or drag images here..."
                  className="flex-1"
                  autoComplete="off"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isLoading}
                />
                
                <Button 
                  onClick={() => handleSendMessage()} 
                  disabled={isLoading || (input.trim() === "" && attachments.length === 0)}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}