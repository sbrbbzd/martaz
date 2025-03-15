# Button Component

A versatile and customizable button component for the Mart.az platform. This component provides a consistent button style across the application with various variants, sizes, and states.

## Features

- Multiple style variants: primary, secondary, accent, outline, text
- Different sizes: small, medium, large
- Support for icons (left or right position)
- Loading state with spinner animation
- Disabled state
- Full-width option
- Link button variant (internal and external links)

## Usage

### Basic Button

```jsx
import { Button } from 'components/common/Button';

// Basic usage
<Button>Default Button</Button>

// With variant
<Button variant="primary">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="accent">Accent Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="text">Text Button</Button>

// Different sizes
<Button size="sm">Small Button</Button>
<Button size="md">Medium Button</Button>
<Button size="lg">Large Button</Button>

// States
<Button disabled>Disabled Button</Button>
<Button loading>Loading Button</Button>

// Full width
<Button fullWidth>Full Width Button</Button>
```

### With Icons

```jsx
import { Button } from 'components/common/Button';
import { FiArrowRight, FiPlus } from 'react-icons/fi';

// Icon on the right (default)
<Button icon={<FiArrowRight />}>Button with Icon</Button>

// Icon on the left
<Button icon={<FiPlus />} iconPosition="left">Button with Icon</Button>

// Material icons can also be used
<Button icon={<span className="material-icons">arrow_forward</span>}>
  With Material Icon
</Button>
```

### Link Buttons

```jsx
import { LinkButton } from 'components/common/Button';
import { FiExternalLink } from 'react-icons/fi';

// Internal link (uses React Router)
<LinkButton to="/categories">Browse Categories</LinkButton>

// External link
<LinkButton 
  to="https://example.com" 
  external 
  icon={<FiExternalLink />}
>
  Visit External Site
</LinkButton>
```

### Integration Examples

#### With Card Component

```jsx
import Card, { CardContent, CardFooter } from 'components/common/Card';
import { Button, LinkButton } from 'components/common/Button';

<Card variant="default" padding="md" radius="lg">
  <CardContent>
    <h3>Card Title</h3>
    <p>Card content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline" size="sm">Cancel</Button>
    <Button variant="primary" size="sm">Submit</Button>
  </CardFooter>
</Card>
```

#### In a Form

```jsx
<form onSubmit={handleSubmit}>
  {/* Form fields */}
  <div className="form-actions">
    <Button 
      type="submit" 
      variant="primary" 
      loading={isSubmitting}
      disabled={!isValid}
    >
      Submit
    </Button>
    <Button 
      type="button" 
      variant="outline" 
      onClick={handleCancel}
    >
      Cancel
    </Button>
  </div>
</form>
```

#### With Badge

```jsx
import Badge from 'components/common/Badge';
import { Button } from 'components/common/Button';

<Button variant="primary">
  Notifications
  <Badge variant="error" size="sm" rounded>5</Badge>
</Button>
```

## Props

### Button Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'accent' \| 'outline' \| 'text'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `fullWidth` | `boolean` | `false` | Whether the button should take full width |
| `icon` | `React.ReactNode` | `undefined` | Icon to display with the button |
| `iconPosition` | `'left' \| 'right'` | `'right'` | Position of the icon |
| `loading` | `boolean` | `false` | Whether the button is in loading state |
| `disabled` | `boolean` | `false` | Whether the button is disabled |
| `className` | `string` | `''` | Additional CSS class names |

### LinkButton Props

Includes all Button props except `loading` and `disabled`, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `to` | `string` | Required | URL to navigate to |
| `external` | `boolean` | `false` | Whether the link is external (opens in new tab) |

## Styling

The Button component uses SCSS for styling. You can customize the appearance by modifying the `Button.scss` file. 