/**
 * SNAPSHOT TESTS - UI COMPONENTS
 * Tests visuales para detectar cambios no intencionales
 */

import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

describe.skip('📸 Button Snapshots', () => {
  test('✅ Snapshot: Button default', () => {
    const { container } = render(<Button>Default Button</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button primary', () => {
    const { container } = render(<Button variant="default">Primary</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button destructive', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button outline', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button ghost', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button sizes', () => {
    const { container: sm } = render(<Button size="sm">Small</Button>);
    const { container: md } = render(<Button size="default">Default</Button>);
    const { container: lg } = render(<Button size="lg">Large</Button>);

    expect(sm.firstChild).toMatchSnapshot();
    expect(md.firstChild).toMatchSnapshot();
    expect(lg.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Button disabled', () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe.skip('📸 Input Snapshots', () => {
  test('✅ Snapshot: Input default', () => {
    const { container } = render(<Input placeholder="Enter text" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Input types', () => {
    const { container: text } = render(<Input type="text" />);
    const { container: email } = render(<Input type="email" />);
    const { container: password } = render(<Input type="password" />);
    const { container: number } = render(<Input type="number" />);

    expect(text.firstChild).toMatchSnapshot();
    expect(email.firstChild).toMatchSnapshot();
    expect(password.firstChild).toMatchSnapshot();
    expect(number.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Input disabled', () => {
    const { container } = render(<Input disabled placeholder="Disabled" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Input with value', () => {
    const { container } = render(<Input value="Test value" readOnly />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe.skip('📸 Card Snapshots', () => {
  test('✅ Snapshot: Card complete', () => {
    const { container } = render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>This is a card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Card simple', () => {
    const { container } = render(
      <Card>
        <CardContent>Simple card</CardContent>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Card with custom className', () => {
    const { container } = render(
      <Card className="bg-blue-500">
        <CardContent>Custom styled card</CardContent>
      </Card>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe.skip('📸 Badge Snapshots', () => {
  test('✅ Snapshot: Badge default', () => {
    const { container } = render(<Badge>Default</Badge>);
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Badge variants', () => {
    const { container: def } = render(<Badge variant="default">Default</Badge>);
    const { container: secondary } = render(<Badge variant="secondary">Secondary</Badge>);
    const { container: destructive } = render(<Badge variant="destructive">Destructive</Badge>);
    const { container: outline } = render(<Badge variant="outline">Outline</Badge>);

    expect(def.firstChild).toMatchSnapshot();
    expect(secondary.firstChild).toMatchSnapshot();
    expect(destructive.firstChild).toMatchSnapshot();
    expect(outline.firstChild).toMatchSnapshot();
  });
});

describe.skip('📸 Alert Snapshots', () => {
  test('✅ Snapshot: Alert default', () => {
    const { container } = render(
      <Alert>
        <AlertTitle>Alert Title</AlertTitle>
        <AlertDescription>This is an alert message</AlertDescription>
      </Alert>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Alert variants', () => {
    const { container: def } = render(
      <Alert>
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Default alert</AlertDescription>
      </Alert>
    );

    const { container: destructive } = render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Destructive alert</AlertDescription>
      </Alert>
    );

    expect(def.firstChild).toMatchSnapshot();
    expect(destructive.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Alert without title', () => {
    const { container } = render(
      <Alert>
        <AlertDescription>Alert without title</AlertDescription>
      </Alert>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});

describe.skip('📸 Complex Layouts Snapshots', () => {
  test('✅ Snapshot: Dashboard card layout', () => {
    const { container } = render(
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">125</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Tenants</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">89</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">€125,000</p>
          </CardContent>
        </Card>
      </div>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: Form layout', () => {
    const { container } = render(
      <form className="space-y-4">
        <div>
          <label htmlFor="name">Name</label>
          <Input id="name" placeholder="Enter your name" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <Input id="email" type="email" placeholder="Enter your email" />
        </div>
        <Button type="submit">Submit</Button>
      </form>
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('✅ Snapshot: List with badges', () => {
    const { container } = render(
      <ul className="space-y-2">
        <li className="flex justify-between items-center">
          <span>Property 1</span>
          <Badge variant="default">Available</Badge>
        </li>
        <li className="flex justify-between items-center">
          <span>Property 2</span>
          <Badge variant="secondary">Rented</Badge>
        </li>
        <li className="flex justify-between items-center">
          <span>Property 3</span>
          <Badge variant="destructive">Maintenance</Badge>
        </li>
      </ul>
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
