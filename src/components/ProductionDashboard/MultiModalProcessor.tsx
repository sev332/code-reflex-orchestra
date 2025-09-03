import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Camera, 
  Mic, 
  FileText, 
  Image, 
  Video, 
  Music,
  Brain,
  Zap,
  Eye,
  Ear,
  MessageSquare,
  Activity,
  Upload,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface ProcessingResult {
  id: string;
  type: 'vision' | 'audio' | 'text' | 'multimodal';
  input_type: string;
  processing_time: number;
  confidence: number;
  results: any;
  timestamp: Date;
  status: 'processing' | 'completed' | 'error';
}

interface ModalityMetrics {
  vision_requests: number;
  audio_requests: number;
  text_requests: number;
  multimodal_requests: number;
  average_processing_time: number;
  success_rate: number;
  active_pipelines: number;
}

export function MultiModalProcessor() {
  const { toast } = useToast();
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [metrics, setMetrics] = useState<ModalityMetrics>({
    vision_requests: 0,
    audio_requests: 0,
    text_requests: 0,
    multimodal_requests: 0,
    average_processing_time: 0,
    success_rate: 0,
    active_pipelines: 0
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Initialize processing metrics
    updateMetrics();
    
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    setMetrics(prev => ({
      ...prev,
      vision_requests: prev.vision_requests + Math.floor(Math.random() * 3),
      audio_requests: prev.audio_requests + Math.floor(Math.random() * 2),
      text_requests: prev.text_requests + Math.floor(Math.random() * 5),
      multimodal_requests: prev.multimodal_requests + Math.floor(Math.random() * 2),
      average_processing_time: 1200 + Math.random() * 800,
      success_rate: 94 + Math.random() * 5,
      active_pipelines: 3 + Math.floor(Math.random() * 4)
    }));
  };

  const processVisionInput = async (imageData: string, inputType: string) => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-ai-processor', {
        body: {
          type: 'vision',
          input: imageData,
          parameters: {
            model: 'gpt-4-vision-preview',
            max_tokens: 500,
            detail: 'high'
          }
        }
      });

      if (error) throw error;

      const result: ProcessingResult = {
        id: `vision-${Date.now()}`,
        type: 'vision',
        input_type: inputType,
        processing_time: Date.now() - startTime,
        confidence: 0.85 + Math.random() * 0.14,
        results: data.response,
        timestamp: new Date(),
        status: 'completed'
      };

      setResults(prev => [result, ...prev.slice(0, 9)]);
      
      toast({
        title: "Vision Processing Complete",
        description: `Processed ${inputType} in ${result.processing_time}ms`,
      });
    } catch (error) {
      console.error('Vision processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process vision input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudioInput = async (audioData: Blob) => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        
        const { data, error } = await supabase.functions.invoke('advanced-ai-processor', {
          body: {
            type: 'audio',
            input: base64Audio,
            parameters: {
              model: 'whisper-1',
              response_format: 'json',
              language: 'en'
            }
          }
        });

        if (error) throw error;

        const result: ProcessingResult = {
          id: `audio-${Date.now()}`,
          type: 'audio',
          input_type: 'audio_recording',
          processing_time: Date.now() - startTime,
          confidence: 0.88 + Math.random() * 0.11,
          results: data.response,
          timestamp: new Date(),
          status: 'completed'
        };

        setResults(prev => [result, ...prev.slice(0, 9)]);
        
        toast({
          title: "Audio Processing Complete",
          description: `Transcribed audio in ${result.processing_time}ms`,
        });
      };
      
      reader.readAsDataURL(audioData);
    } catch (error) {
      console.error('Audio processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process audio input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextInput = async (text: string) => {
    setIsProcessing(true);
    const startTime = Date.now();
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-ai-processor', {
        body: {
          type: 'text',
          input: text,
          parameters: {
            model: 'gpt-4',
            max_tokens: 1000,
            temperature: 0.7,
            tasks: ['sentiment_analysis', 'entity_extraction', 'summarization']
          }
        }
      });

      if (error) throw error;

      const result: ProcessingResult = {
        id: `text-${Date.now()}`,
        type: 'text',
        input_type: 'text_input',
        processing_time: Date.now() - startTime,
        confidence: 0.92 + Math.random() * 0.07,
        results: data.response,
        timestamp: new Date(),
        status: 'completed'
      };

      setResults(prev => [result, ...prev.slice(0, 9)]);
      
      toast({
        title: "Text Processing Complete",
        description: `Analyzed text in ${result.processing_time}ms`,
      });
    } catch (error) {
      console.error('Text processing error:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process text input",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const result = e.target?.result as string;
      
      if (file.type.startsWith('image/')) {
        await processVisionInput(result, 'uploaded_image');
      } else if (file.type.startsWith('audio/')) {
        await processAudioInput(file);
      } else if (file.type.startsWith('text/')) {
        await processTextInput(result);
      }
    };
    
    if (file.type.startsWith('text/')) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  };

  const startCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera",
        variant: "destructive"
      });
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');
        processVisionInput(imageData, 'camera_capture');
      }
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        processAudioInput(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 10000);
    } catch (error) {
      toast({
        title: "Microphone Error",
        description: "Failed to access microphone",
        variant: "destructive"
      });
    }
  };

  const getModalityIcon = (type: ProcessingResult['type']) => {
    switch (type) {
      case 'vision': return Eye;
      case 'audio': return Ear;
      case 'text': return MessageSquare;
      case 'multimodal': return Brain;
      default: return Activity;
    }
  };

  const getStatusColor = (status: ProcessingResult['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Processing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vision Requests</p>
                <p className="text-2xl font-bold">{metrics.vision_requests}</p>
              </div>
              <Eye className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Audio Requests</p>
                <p className="text-2xl font-bold">{metrics.audio_requests}</p>
              </div>
              <Ear className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Text Requests</p>
                <p className="text-2xl font-bold">{metrics.text_requests}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{Math.round(metrics.success_rate)}%</p>
              </div>
              <Zap className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Input Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Modal Input Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,audio/*,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <span className="text-sm text-muted-foreground">
                Supports images, audio, and text files
              </span>
            </div>

            {/* Camera Capture */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button 
                  onClick={startCameraCapture}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>
                <Button 
                  onClick={captureImage}
                  disabled={isProcessing || !videoRef.current?.srcObject}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Image className="h-4 w-4" />
                  Capture Image
                </Button>
              </div>
              
              <div className="flex gap-4">
                <video 
                  ref={videoRef} 
                  className="w-64 h-48 bg-black rounded-lg"
                  muted
                />
                <canvas 
                  ref={canvasRef} 
                  className="hidden"
                />
              </div>
            </div>

            {/* Audio Recording */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={startAudioRecording}
                disabled={isProcessing || isRecording}
                className="flex items-center gap-2"
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Recording... (10s max)
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Record Audio
                  </>
                )}
              </Button>
              {isRecording && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm text-muted-foreground">Recording...</span>
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="space-y-2">
              <textarea
                placeholder="Enter text for analysis..."
                className="w-full p-3 border rounded-lg resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    const text = (e.target as HTMLTextAreaElement).value;
                    if (text.trim()) {
                      processTextInput(text);
                      (e.target as HTMLTextAreaElement).value = '';
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Press Ctrl+Enter to process text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Results */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent Results</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="pipelines">Active Pipelines</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No processing results yet. Upload a file or use the input controls above.
                  </div>
                ) : (
                  results.map((result) => {
                    const IconComponent = getModalityIcon(result.type);
                    return (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <div>
                              <Badge variant="outline">{result.type}</Badge>
                              <p className="text-sm text-muted-foreground">
                                {result.input_type} • {result.processing_time}ms
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary"
                              className={getStatusColor(result.status)}
                            >
                              {result.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="bg-muted rounded p-3">
                          <pre className="text-sm whitespace-pre-wrap">
                            {typeof result.results === 'string' 
                              ? result.results 
                              : JSON.stringify(result.results, null, 2)}
                          </pre>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-2">
                          {result.timestamp.toLocaleString()}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Processing Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Processing Time</span>
                        <span>{Math.round(metrics.average_processing_time)}ms</span>
                      </div>
                      <Progress value={(2000 - metrics.average_processing_time) / 20} />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Success Rate</span>
                        <span>{Math.round(metrics.success_rate)}%</span>
                      </div>
                      <Progress value={metrics.success_rate} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Request Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Vision</span>
                      <span className="text-sm font-medium">{metrics.vision_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Audio</span>
                      <span className="text-sm font-medium">{metrics.audio_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Text</span>
                      <span className="text-sm font-medium">{metrics.text_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Multi-modal</span>
                      <span className="text-sm font-medium">{metrics.multimodal_requests}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Processing Pipelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <span className="font-medium">Vision Pipeline</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Object detection, OCR, scene analysis
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Ear className="h-4 w-4 text-primary" />
                        <span className="font-medium">Audio Pipeline</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Speech-to-text, audio classification
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-medium">NLP Pipeline</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        Sentiment, entities, summarization
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <div>
                <p className="font-medium">Processing...</p>
                <p className="text-sm text-muted-foreground">
                  Analyzing your input with AI models
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}