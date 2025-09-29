"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Zap, 
  Users, 
  Shield, 
  ArrowRight
} from "lucide-react";

export function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "智能工作流管理",
      description: "创建、编辑和管理 ComfyUI 工作流，支持复杂的图像生成任务"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "实时生成监控",
      description: "实时跟踪图像生成进度，支持批量处理和状态监控"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "用户权限管理",
      description: "安全的用户认证系统，保护您的工作流和数据安全"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "云端存储",
      description: "自动保存生成的图像到云端，支持历史记录和批量下载"
    }
  ];


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="outline" className="mb-6 bg-white/80 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              ComfyUI 工作流管理平台
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI 图像生成
              <br />
              <span className="text-4xl md:text-5xl">工作流管理</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              创建、管理和批量执行 ComfyUI 工作流，让 AI 图像生成变得更加简单高效。
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {status === "authenticated" ? (
                // 已登录用户显示进入应用的按钮
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                  onClick={() => router.push("/dashboard")}
                >
                  进入应用
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                // 未登录用户显示注册和登录按钮
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                    onClick={() => router.push("/auth/signup")}
                  >
                    立即开始
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 text-lg bg-white/80 backdrop-blur-sm"
                    onClick={() => router.push("/auth/signin")}
                  >
                    已有账户？登录
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-2000"></div>
          
          {/* 可爱的小猫 */}
          <div className="absolute top-1/2 right-1/6 w-32 h-32 opacity-30 animate-bounce">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* 小猫身体 */}
              <ellipse cx="50" cy="70" rx="25" ry="20" fill="#8B5CF6" opacity="0.8"/>
              
              {/* 小猫头部 */}
              <circle cx="50" cy="45" r="20" fill="#A855F7" opacity="0.9"/>
              
              {/* 小猫耳朵 */}
              <polygon points="35,30 40,15 45,30" fill="#9333EA" opacity="0.9"/>
              <polygon points="55,30 60,15 65,30" fill="#9333EA" opacity="0.9"/>
              
              {/* 小猫内耳 */}
              <polygon points="37,25 40,18 43,25" fill="#EC4899" opacity="0.7"/>
              <polygon points="57,25 60,18 63,25" fill="#EC4899" opacity="0.7"/>
              
              {/* 小猫眼睛 */}
              <circle cx="42" cy="40" r="3" fill="#1F2937"/>
              <circle cx="58" cy="40" r="3" fill="#1F2937"/>
              
              {/* 小猫鼻子 */}
              <polygon points="50,45 48,48 52,48" fill="#EC4899"/>
              
              {/* 小猫嘴巴 */}
              <path d="M 50 48 Q 45 52 40 50" stroke="#1F2937" strokeWidth="1.5" fill="none"/>
              <path d="M 50 48 Q 55 52 60 50" stroke="#1F2937" strokeWidth="1.5" fill="none"/>
              
              {/* 小猫胡须 */}
              <line x1="30" y1="45" x2="35" y2="47" stroke="#1F2937" strokeWidth="1"/>
              <line x1="30" y1="50" x2="35" y2="50" stroke="#1F2937" strokeWidth="1"/>
              <line x1="30" y1="55" x2="35" y2="53" stroke="#1F2937" strokeWidth="1"/>
              <line x1="70" y1="45" x2="65" y2="47" stroke="#1F2937" strokeWidth="1"/>
              <line x1="70" y1="50" x2="65" y2="50" stroke="#1F2937" strokeWidth="1"/>
              <line x1="70" y1="55" x2="65" y2="53" stroke="#1F2937" strokeWidth="1"/>
              
              {/* 小猫尾巴 */}
              <path d="M 75 70 Q 85 60 90 70 Q 85 80 75 70" fill="#8B5CF6" opacity="0.8"/>
              
              {/* 小猫爪子 */}
              <ellipse cx="40" cy="85" rx="4" ry="6" fill="#A855F7" opacity="0.8"/>
              <ellipse cx="50" cy="85" rx="4" ry="6" fill="#A855F7" opacity="0.8"/>
              <ellipse cx="60" cy="85" rx="4" ry="6" fill="#A855F7" opacity="0.8"/>
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              强大的功能特性
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              专为 ComfyUI 工作流设计的管理平台，提供完整的图像生成解决方案
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              简单三步，开始创作
            </h2>
            <p className="text-xl text-gray-600">
              无需复杂配置，快速上手 AI 图像生成
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">注册账户</h3>
              <p className="text-gray-600">
                快速注册，创建您的专属账户，开始您的 AI 创作之旅
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">创建工作流</h3>
              <p className="text-gray-600">
                导入或创建 ComfyUI 工作流，配置参数，准备生成图像
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">生成与下载</h3>
              <p className="text-gray-600">
                一键生成图像，实时监控进度，自动保存到云端
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            {status === "authenticated" ? (
              <>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  欢迎回来！
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  继续您的 AI 图像生成工作流
                </p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  开始使用
                </h2>
                <p className="text-xl text-gray-600 mb-8">
                  立即注册，体验 ComfyUI 工作流管理平台
                </p>
              </>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {status === "authenticated" ? (
                // 已登录用户显示进入应用的按钮
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                  onClick={() => router.push("/dashboard")}
                >
                  进入应用
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                // 未登录用户显示注册和登录按钮
                <>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 text-lg"
                    onClick={() => router.push("/auth/signup")}
                  >
                    免费注册
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 text-lg bg-white/80 backdrop-blur-sm"
                    onClick={() => router.push("/auth/signin")}
                  >
                    已有账户？登录
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            &copy; 2024 ComfyUI 工作流管理系统
          </p>
        </div>
      </footer>

    </div>
  );
}
