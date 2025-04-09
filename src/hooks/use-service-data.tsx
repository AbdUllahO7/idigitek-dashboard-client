"use client"

import { useState } from "react"

// Define types for the service data
export interface ServiceData {
  hero: {
    en: HeroData
    ar: HeroData
  }
  benefits: {
    en: BenefitData[]
    ar: BenefitData[]
  }
  features: {
    en: FeatureData[]
    ar: FeatureData[]
  }
  processSteps: {
    en: ProcessStepData[]
    ar: ProcessStepData[]
  }
  faq: {
    en: FaqData[]
    ar: FaqData[]
  }
}

export interface HeroData {
  backgroundImage: string
  title: string
  description: string
  backLink: string
  backLinkText: string
}

export interface BenefitData {
  icon: string
  title: string
  description: string
}

export interface FeatureData {
  id: string
  title: string
  content: {
    heading: string
    description: string
    features: string[]
    image: string
    imageAlt: string
    imagePosition: string
  }
}

export interface ProcessStepData {
  icon: string
  title: string
  description: string
}

export interface FaqData {
  question: string
  answer: string
}

// Initial empty service data
const initialServiceData: ServiceData = {
  hero: {
    en: {
      backgroundImage: "",
      title: "",
      description: "",
      backLink: "/services",
      backLinkText: "Back to Services",
    },
    ar: {
      backgroundImage: "",
      title: "",
      description: "",
      backLink: "/services",
      backLinkText: "العودة إلى الخدمات",
    },
  },
  benefits: {
    en: [],
    ar: [],
  },
  features: {
    en: [],
    ar: [],
  },
  processSteps: {
    en: [],
    ar: [],
  },
  faq: {
    en: [],
    ar: [],
  },
}

// Sample data for demonstration
const sampleServiceData: ServiceData = {
  hero: {
    en: {
      backgroundImage: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?q=80&w=1470&auto=format&fit=crop",
      title: "Smart Drive-Through Solutions",
      description:
        "Revolutionize your drive-through experience with AI-powered ordering systems, digital menu boards, and efficient queue management technology.",
      backLink: "/services",
      backLinkText: "Back to Services",
    },
    ar: {
      backgroundImage: "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?q=80&w=1470&auto=format&fit=crop",
      title: "حلول السيارات الذكية",
      description:
        "قم بثورة في تجربة خدمة السيارات مع أنظمة الطلب المدعومة بالذكاء الاصطناعي، ولوحات القوائم الرقمية، وتقنية إدارة الطوابير الفعالة.",
      backLink: "/services",
      backLinkText: "العودة إلى الخدمات",
    },
  },
  benefits: {
    en: [
      {
        icon: "Clock",
        title: "Reduced Wait Times",
        description: "Decrease average service time by up to 40% with optimized queue management",
      },
      {
        icon: "MessageSquare",
        title: "Improved Order Accuracy",
        description: "AI-powered systems reduce errors by up to 85% compared to traditional methods",
      },
    ],
    ar: [
      {
        icon: "Clock",
        title: "تقليل أوقات الانتظار",
        description: "تقليل متوسط وقت الخدمة بنسبة تصل إلى 40٪ مع إدارة الطوابير المحسنة",
      },
      {
        icon: "MessageSquare",
        title: "تحسين دقة الطلبات",
        description: "تقلل الأنظمة المدعومة بالذكاء الاصطناعي الأخطاء بنسبة تصل إلى 85٪ مقارنة بالطرق التقليدية",
      },
    ],
  },
  features: {
    en: [
      {
        id: "ai",
        title: "AI-Powered Ordering",
        content: {
          heading: "AI-Powered Ordering System",
          description:
            "Our advanced natural language processing technology understands customer orders with remarkable accuracy, even in noisy environments or with different accents.",
          features: [
            "98.5% order accuracy in real-world conditions",
            "Automatic upselling suggestions based on order patterns",
          ],
          image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1374&auto=format&fit=crop",
          imageAlt: "AI-Powered Ordering System",
          imagePosition: "right",
        },
      },
    ],
    ar: [
      {
        id: "ai",
        title: "طلب مدعوم بالذكاء الاصطناعي",
        content: {
          heading: "نظام طلب مدعوم بالذكاء الاصطناعي",
          description:
            "تفهم تقنية معالجة اللغة الطبيعية المتقدمة لدينا طلبات العملاء بدقة مذهلة، حتى في البيئات الصاخبة أو مع اللهجات المختلفة.",
          features: ["دقة طلب بنسبة 98.5٪ في ظروف العالم الحقيقي", "اقتراحات بيع إضافية تلقائية بناءً على أنماط الطلب"],
          image: "https://images.unsplash.com/photo-1535378917042-10a22c95931a?q=80&w=1374&auto=format&fit=crop",
          imageAlt: "نظام طلب مدعوم بالذكاء الاصطناعي",
          imagePosition: "right",
        },
      },
    ],
  },
  processSteps: {
    en: [
      {
        icon: "Car",
        title: "Customer Arrival",
        description:
          "Vehicle detection sensors identify approaching customers and trigger the system to prepare for their order.",
      },
      {
        icon: "MonitorSmartphone",
        title: "Order Placement",
        description:
          "AI-powered system takes the customer's order through voice recognition or touchscreen interface with high accuracy.",
      },
    ],
    ar: [
      {
        icon: "Car",
        title: "وصول العميل",
        description: "تحدد أجهزة استشعار اكتشاف المركبات العملاء القادمين وتعمل على تشغيل النظام للاستعداد لطلبهم.",
      },
      {
        icon: "MonitorSmartphone",
        title: "تقديم الطلب",
        description:
          "يأخذ النظام المدعوم بالذكاء الاصطناعي طلب العميل من خلال التعرف على الصوت أو واجهة شاشة اللمس بدقة عالية.",
      },
    ],
  },
  faq: {
    en: [
      {
        question: "How long does implementation take?",
        answer:
          "Typical implementation takes 2-4 weeks depending on the complexity of your existing systems and the number of locations. Our team works efficiently to minimize disruption to your operations.",
      },
    ],
    ar: [
      {
        question: "كم من الوقت يستغرق التنفيذ؟",
        answer:
          "يستغرق التنفيذ النموذجي 2-4 أسابيع حسب تعقيد الأنظمة الحالية وعدد المواقع. يعمل فريقنا بكفاءة لتقليل الاضطراب في عملياتك.",
      },
    ],
  },
}

export function useServiceData() {
  const [serviceData, setServiceData] = useState<ServiceData>(initialServiceData)

  // Load sample data
  const loadSampleData = () => {
    setServiceData(sampleServiceData)
  }

  // Export data as JSON
  const exportData = () => {
    const dataStr = JSON.stringify(serviceData, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `service-data-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  // Import data from JSON
  const importData = (jsonData: string) => {
    try {
      const parsedData = JSON.parse(jsonData) as ServiceData
      setServiceData(parsedData)
      return { success: true, message: "Data imported successfully" }
    } catch (error) {
      return { success: false, message: "Invalid JSON data" }
    }
  }

  return {
    serviceData,
    setServiceData,
    loadSampleData,
    exportData,
    importData,
  }
}
