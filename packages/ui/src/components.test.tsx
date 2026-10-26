import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { axeViolations } from '../test/axe';
import {
  Button,
  Callout,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  MoneyField,
  formatMoney,
  parseMoney,
  Pill,
  Select,
  TextField,
} from './index';

const offices = [
  { id: 'harare', label: 'Harare' },
  { id: 'bulawayo', label: 'Bulawayo' },
];

describe('Button', () => {
  it('calls onPress when clicked', async () => {
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledOnce();
  });

  it('ignores presses while pending, so a double click cannot submit twice', async () => {
    const onPress = vi.fn();
    render(
      <Button isPending onPress={onPress}>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('links the label, hint and error to the input', () => {
    render(
      <TextField
        label="National ID"
        description="Format 63-123456A78"
        errorMessage="Enter the national ID number, or a phone number if the client has no ID."
      />,
    );
    const input = screen.getByLabelText('National ID');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Format 63-123456A78/);
    expect(input).toHaveAccessibleDescription(/or a phone number/);
  });

  it('renders a textarea when multiline', () => {
    render(<TextField label="Summary" multiline />);
    expect(screen.getByLabelText('Summary').tagName).toBe('TEXTAREA');
  });
});

describe('Select', () => {
  function Controlled({ onChange }: { onChange: (id: string | null) => void }) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Select
        label="Office"
        options={offices}
        value={value}
        onChange={(id) => {
          setValue(id);
          onChange(id);
        }}
      />
    );
  }

  it('can be chosen with the keyboard and reports the option id', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    await user.click(await screen.findByRole('option', { name: 'Bulawayo' }));
    expect(onChange).toHaveBeenCalledWith('bulawayo');
    expect(screen.getByRole('button', { name: /Bulawayo/ })).toBeInTheDocument();
  });
});

describe('Checkbox', () => {
  it('toggles', async () => {
    render(<Checkbox>Client agreed to SMS</Checkbox>);
    const box = screen.getByRole('checkbox', { name: 'Client agreed to SMS' });
    await userEvent.click(box);
    expect(box).toBeChecked();
  });
});

describe('states', () => {
  it('ErrorState is announced, shows the support reference and retries', async () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} reference="req_77c" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Support reference: req_77c');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('LoadingSkeleton is a status with a readable label', () => {
    render(<LoadingSkeleton label="Loading cases" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading cases');
  });

  it('EmptyState shows its action', () => {
    render(<EmptyState message="No cases yet" action={<Button>New case</Button>} />);
    expect(screen.getByRole('button', { name: 'New case' })).toBeInTheDocument();
  });
});

describe('accessibility', () => {
  it('a form built from the components has no axe violations', async () => {
    const { container } = render(
      <main>
        <h1>Intake</h1>
        <Callout title="Possible conflict">The other party is an existing client.</Callout>
        <TextField label="Full name" isRequired />
        <TextField label="National ID" errorMessage="Use the format 63-123456A78" />
        <Select label="Office" options={offices} />
        <Checkbox>Client consents to us keeping their details</Checkbox>
        <Pill tone="warning">Screening</Pill>
        <EmptyState message="No hearings yet" />
        <LoadingSkeleton />
        <Button variant="primary">Continue</Button>
      </main>,
    );
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe('Modal and ConfirmDialog', () => {
  it('requires a reason before it can be confirmed, then passes it on', async () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Approve as an exception"
        message="This client does not meet the criteria."
        confirmLabel="Approve anyway"
        reasonLabel="Why is this an exception?"
        onClose={() => undefined}
        onConfirm={onConfirm}
      />,
    );
    const dialog = screen.getByRole('dialog', { name: 'Approve as an exception' });
    const confirm = within(dialog).getByRole('button', { name: 'Approve anyway' });
    expect(confirm).toBeDisabled();

    await userEvent.type(
      within(dialog).getByLabelText('Why is this an exception?'),
      'Temporary hardship',
    );
    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Temporary hardship');
  });

  it('closes with Cancel and with Escape', async () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Close case"
        message="Sure?"
        confirmLabel="Close"
        onClose={onClose}
        onConfirm={() => undefined}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('shows a server error inside the dialog as an alert', () => {
    render(
      <ConfirmDialog
        isOpen
        title="T"
        message="m"
        confirmLabel="Go"
        error="This application has already been decided."
        onClose={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('already been decided');
  });

  it('has no axe violations when open', async () => {
    render(
      <ConfirmDialog
        isOpen
        title="Close case"
        message="Are you sure?"
        confirmLabel="Close"
        onClose={() => undefined}
        onConfirm={() => undefined}
      />,
    );
    expect(await axeViolations(screen.getByRole('dialog'))).toEqual([]);
  });
});

describe('MoneyField', () => {
  function Harness({ onChange }: { onChange: (n: number) => void }) {
    const [value, setValue] = useState(0);
    return (
      <MoneyField
        label="Wages"
        value={value}
        onChange={(n) => {
          setValue(n);
          onChange(n);
        }}
      />
    );
  }

  it.each([
    ['180', 18000],
    ['180.5', 18050],
    ['1,250.75', 125075],
    ['$0.10', 10],
    ['', 0],
  ])('reads %j as %i cents', (text, cents) => {
    expect(parseMoney(text)).toBe(cents);
  });

  it('refuses text that is not money', () => {
    for (const bad of ['abc', '12.345', '-5', '1e3']) expect(parseMoney(bad)).toBeUndefined();
  });

  it('keeps cents exact and reports them as whole numbers', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(screen.getByLabelText('Wages'), '0.30');
    expect(onChange).toHaveBeenLastCalledWith(30);
    expect(formatMoney(30)).toBe('0.30');
  });

  it('flags an unreadable entry without losing what was typed', async () => {
    render(<Harness onChange={() => undefined} />);
    await userEvent.type(screen.getByLabelText('Wages'), 'abc');
    expect(screen.getByLabelText('Wages')).toHaveValue('abc');
    expect(screen.getByText(/Enter an amount in dollars/)).toBeInTheDocument();
  });
});
