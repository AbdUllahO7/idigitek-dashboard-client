import { ServiceData } from "../hooks/use-service-data"

// URL validation regex
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

// Validate service data
export function validateServiceData(data: ServiceData) {
  const errors: Record<string, string[]> = {}
  let isValid = true

  // Validate hero section
  const heroErrors: Record<string, string[]> = {}

  // Validate English hero
  const enHeroErrors: string[] = []
  if (!data.hero.en.title) {
    enHeroErrors.push("Title is required")
    isValid = false
  } else if (data.hero.en.title.length > 100) {
    enHeroErrors.push("Title must be less than 100 characters")
    isValid = false
  }

  if (!data.hero.en.description) {
    enHeroErrors.push("Description is required")
    isValid = false
  } else if (data.hero.en.description.length > 500) {
    enHeroErrors.push("Description must be less than 500 characters")
    isValid = false
  }

  if (data.hero.en.backgroundImage && !urlRegex.test(data.hero.en.backgroundImage)) {
    enHeroErrors.push("Background image must be a valid URL")
    isValid = false
  }

  if (enHeroErrors.length > 0) {
    heroErrors.en = enHeroErrors
  }

  // Validate Arabic hero
  const arHeroErrors: string[] = []
  if (!data.hero.ar.title) {
    arHeroErrors.push("Title is required")
    isValid = false
  } else if (data.hero.ar.title.length > 100) {
    arHeroErrors.push("Title must be less than 100 characters")
    isValid = false
  }

  if (!data.hero.ar.description) {
    arHeroErrors.push("Description is required")
    isValid = false
  } else if (data.hero.ar.description.length > 500) {
    arHeroErrors.push("Description must be less than 500 characters")
    isValid = false
  }

  if (data.hero.ar.backgroundImage && !urlRegex.test(data.hero.ar.backgroundImage)) {
    arHeroErrors.push("Background image must be a valid URL")
    isValid = false
  }

  if (arHeroErrors.length > 0) {
    heroErrors.ar = arHeroErrors
  }

  if (Object.keys(heroErrors).length > 0) {
    errors.hero = heroErrors
  }

  // Validate benefits
  const benefitsErrors: Record<string, string[]> = {}

  // Validate English benefits
  data.benefits.en.forEach((benefit, index) => {
    const benefitErrors: string[] = []

    if (!benefit.title) {
      benefitErrors.push("Title is required")
      isValid = false
    } else if (benefit.title.length > 50) {
      benefitErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!benefit.description) {
      benefitErrors.push("Description is required")
      isValid = false
    } else if (benefit.description.length > 200) {
      benefitErrors.push("Description must be less than 200 characters")
      isValid = false
    }

    if (benefitErrors.length > 0) {
      benefitsErrors[`en_${index}`] = benefitErrors
    }
  })

  // Validate Arabic benefits
  data.benefits.ar.forEach((benefit, index) => {
    const benefitErrors: string[] = []

    if (!benefit.title) {
      benefitErrors.push("Title is required")
      isValid = false
    } else if (benefit.title.length > 50) {
      benefitErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!benefit.description) {
      benefitErrors.push("Description is required")
      isValid = false
    } else if (benefit.description.length > 200) {
      benefitErrors.push("Description must be less than 200 characters")
      isValid = false
    }

    if (benefitErrors.length > 0) {
      benefitsErrors[`ar_${index}`] = benefitErrors
    }
  })

  if (Object.keys(benefitsErrors).length > 0) {
    errors.benefits = benefitsErrors
  }

  // Validate features
  const featuresErrors: Record<string, string[]> = {}

  // Validate English features
  data.features.en.forEach((feature, index) => {
    const featureErrors: string[] = []

    if (!feature.id) {
      featureErrors.push("ID is required")
      isValid = false
    }

    if (!feature.title) {
      featureErrors.push("Title is required")
      isValid = false
    } else if (feature.title.length > 50) {
      featureErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!feature.content.heading) {
      featureErrors.push("Heading is required")
      isValid = false
    }

    if (!feature.content.description) {
      featureErrors.push("Description is required")
      isValid = false
    }

    if (feature.content.image && !urlRegex.test(feature.content.image)) {
      featureErrors.push("Image must be a valid URL")
      isValid = false
    }

    if (featureErrors.length > 0) {
      featuresErrors[`en_${index}`] = featureErrors
    }
  })

  // Validate Arabic features
  data.features.ar.forEach((feature, index) => {
    const featureErrors: string[] = []

    if (!feature.id) {
      featureErrors.push("ID is required")
      isValid = false
    }

    if (!feature.title) {
      featureErrors.push("Title is required")
      isValid = false
    } else if (feature.title.length > 50) {
      featureErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!feature.content.heading) {
      featureErrors.push("Heading is required")
      isValid = false
    }

    if (!feature.content.description) {
      featureErrors.push("Description is required")
      isValid = false
    }

    if (feature.content.image && !urlRegex.test(feature.content.image)) {
      featureErrors.push("Image must be a valid URL")
      isValid = false
    }

    if (featureErrors.length > 0) {
      featuresErrors[`ar_${index}`] = featureErrors
    }
  })

  if (Object.keys(featuresErrors).length > 0) {
    errors.features = featuresErrors
  }

  // Validate process steps
  const processStepsErrors: Record<string, string[]> = {}

  // Validate English process steps
  data.processSteps.en.forEach((step, index) => {
    const stepErrors: string[] = []

    if (!step.title) {
      stepErrors.push("Title is required")
      isValid = false
    } else if (step.title.length > 50) {
      stepErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!step.description) {
      stepErrors.push("Description is required")
      isValid = false
    } else if (step.description.length > 200) {
      stepErrors.push("Description must be less than 200 characters")
      isValid = false
    }

    if (stepErrors.length > 0) {
      processStepsErrors[`en_${index}`] = stepErrors
    }
  })

  // Validate Arabic process steps
  data.processSteps.ar.forEach((step, index) => {
    const stepErrors: string[] = []

    if (!step.title) {
      stepErrors.push("Title is required")
      isValid = false
    } else if (step.title.length > 50) {
      stepErrors.push("Title must be less than 50 characters")
      isValid = false
    }

    if (!step.description) {
      stepErrors.push("Description is required")
      isValid = false
    } else if (step.description.length > 200) {
      stepErrors.push("Description must be less than 200 characters")
      isValid = false
    }

    if (stepErrors.length > 0) {
      processStepsErrors[`ar_${index}`] = stepErrors
    }
  })

  if (Object.keys(processStepsErrors).length > 0) {
    errors.processSteps = processStepsErrors
  }

  // Validate FAQ
  const faqErrors: Record<string, string[]> = {}

  // Validate English FAQ
  data.faq.en.forEach((faq, index) => {
    const faqItemErrors: string[] = []

    if (!faq.question) {
      faqItemErrors.push("Question is required")
      isValid = false
    } else if (faq.question.length > 200) {
      faqItemErrors.push("Question must be less than 200 characters")
      isValid = false
    }

    if (!faq.answer) {
      faqItemErrors.push("Answer is required")
      isValid = false
    } else if (faq.answer.length > 1000) {
      faqItemErrors.push("Answer must be less than 1000 characters")
      isValid = false
    }

    if (faqItemErrors.length > 0) {
      faqErrors[`en_${index}`] = faqItemErrors
    }
  })

  // Validate Arabic FAQ
  data.faq.ar.forEach((faq, index) => {
    const faqItemErrors: string[] = []

    if (!faq.question) {
      faqItemErrors.push("Question is required")
      isValid = false
    } else if (faq.question.length > 200) {
      faqItemErrors.push("Question must be less than 200 characters")
      isValid = false
    }

    if (!faq.answer) {
      faqItemErrors.push("Answer is required")
      isValid = false
    } else if (faq.answer.length > 1000) {
      faqItemErrors.push("Answer must be less than 1000 characters")
      isValid = false
    }

    if (faqItemErrors.length > 0) {
      faqErrors[`ar_${index}`] = faqItemErrors
    }
  })

  if (Object.keys(faqErrors).length > 0) {
    errors.faq = faqErrors
  }

  return { isValid, errors }
}
