export interface LayoutBreakpoints {
  mobile: number
  tablet: number
  desktop: number
  wide: number
}

export interface LayoutConfig {
  columns: {
    mobile: number
    tablet: number
    desktop: number
    wide: number
  }
  spacing: {
    mobile: string
    tablet: string
    desktop: string
    wide: string
  }
  cardSize: {
    mobile: string
    tablet: string
    desktop: string
    wide: string
  }
}

export class ResponsiveLayoutService {
  private static breakpoints: LayoutBreakpoints = {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  }

  private static config: LayoutConfig = {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4
    },
    spacing: {
      mobile: 'gap-2',
      tablet: 'gap-4',
      desktop: 'gap-6',
      wide: 'gap-8'
    },
    cardSize: {
      mobile: 'h-32',
      tablet: 'h-40',
      desktop: 'h-48',
      wide: 'h-56'
    }
  }

  static getGridClasses(screenSize: keyof LayoutBreakpoints): string {
    const columns = this.config.columns[screenSize]
    return `grid grid-cols-${columns} ${this.config.spacing[screenSize]}`
  }

  static getCardClasses(screenSize: keyof LayoutBreakpoints): string {
    return `card ${this.config.cardSize[screenSize]}`
  }

  static getResponsiveClasses(): string {
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'
  }

  static getCardResponsiveClasses(): string {
    return 'h-32 md:h-40 lg:h-48 xl:h-56'
  }
}
