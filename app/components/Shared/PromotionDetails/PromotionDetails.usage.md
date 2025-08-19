# PromotionDetails Component Usage

## Overview
A minimal and beautiful component to display promotion details with responsive design and bilingual support (English/Arabic).

## Props
- `promotionId` (string, required): The ID of the promotion to fetch
- `lang` (string, optional): Language preference ('en' or 'ar', defaults to 'en')

## Usage Example

```jsx
import PromotionDetails from './PromotionDetails';

// Basic usage
<PromotionDetails promotionId="6829037dfa20820fb611cd13" />

// With Arabic language
<PromotionDetails promotionId="6829037dfa20820fb611cd13" lang="ar" />
```

## Features
- ✅ Responsive design for mobile and desktop
- ✅ Beautiful gradient discount cards
- ✅ Loading and error states
- ✅ Bilingual support (English/Arabic)
- ✅ Clean, minimal design
- ✅ Service center information display
- ✅ Expiry date formatting
- ✅ Status indicators (Approved/Pending)

## Styling
The component uses SCSS modules with:
- CSS custom properties for theme support
- Responsive breakpoints
- Hover effects and animations
- Dark mode support

## Data Structure
The component expects the exact data structure provided in the sample data, including:
- Promotion title and image
- Discount details array
- Promotion conditions
- Service center information
- Expiry date
- Approval status