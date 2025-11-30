'use client';

/**
 * ORIZON Component Showcase
 *
 * A comprehensive demonstration of all ORIZON UI components
 * with their variants, states, and usage examples.
 */

import { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardIcon,
  Modal,
  ModalFooter,
  Tag,
  TagGroup,
  Progress,
  CircularProgress,
  Spinner,
  EmptyState,
  NoResults,
  NoData,
  ErrorState,
  Logo,
  Tooltip,
  Toast,
  useToast,
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownButton,
  ToggleSwitch,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Breadcrumbs,
  Pagination,
  Accordion,
  Tabs,
  TabList,
  TabButton,
  TabPanels,
  TabPanel,
  FileUpload,
  Avatar,
  AvatarGroup,
} from '../components/ui';

import {
  Home,
  Settings,
  Users,
  FileText,
  Star,
  Zap,
  Plus,
  Search,
  X,
  ChevronDown,
  Edit,
  Trash,
  Copy,
  Download,
  Upload,
  Bell,
  Mail,
  Calendar,
} from 'lucide-react';

export default function ShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [progress, setProgress] = useState(65);
  const [toggleChecked, setToggleChecked] = useState(false);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('tab1');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-border-dark bg-surface-dark">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-primary font-bold text-white">
            ORIZON Component Showcase
          </h1>
          <p className="mt-2 text-text-secondary-dark">
            A comprehensive demonstration of the ORIZON design system components
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Buttons
          </h2>
          <div className="space-y-6">
            {/* Primary Buttons */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Primary Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button size="sm">Small Button</Button>
                <Button size="md">Medium Button</Button>
                <Button size="lg">Large Button</Button>
                <Button icon={<Plus className="w-5 h-5" />}>With Icon</Button>
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>

            {/* Secondary Buttons */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Secondary Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="secondary">Secondary</Button>
                <Button variant="secondary" icon={<Star className="w-5 h-5" />}>
                  With Icon
                </Button>
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Ghost Buttons */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Ghost Variant</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="ghost" icon={<Search className="w-5 h-5" />}>
                  Search
                </Button>
              </div>
            </div>

            {/* Icon Buttons */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Icon Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="icon" size="sm" icon={<Plus className="w-4 h-4" />} />
                <Button variant="icon" size="md" icon={<Settings className="w-5 h-5" />} />
                <Button variant="icon" size="lg" icon={<X className="w-6 h-6" />} />
              </div>
            </div>
          </div>
        </section>

        {/* Form Inputs Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Form Inputs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              helperText="We'll never share your email"
            />
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
            />
            <Input
              label="Search"
              type="text"
              placeholder="Search..."
              icon={<Search className="w-5 h-5" />}
            />
            <Input
              label="With Error"
              type="text"
              error="This field is required"
            />
            <Select
              label="Select Framework"
              placeholder="Choose one..."
              options={[
                { value: 'react', label: 'React' },
                { value: 'vue', label: 'Vue' },
                { value: 'angular', label: 'Angular' },
              ]}
            />
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                placeholder="Enter your description..."
                helperText="Maximum 500 characters"
              />
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cosmic Card */}
            <Card variant="cosmic">
              <CardHeader>
                <CardTitle>Cosmic Card</CardTitle>
                <CardDescription>
                  Default card with subtle cosmic glow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary-dark">
                  This is the default card variant with a dark surface and subtle blue glow effect.
                </p>
              </CardContent>
            </Card>

            {/* Feature Card */}
            <Card variant="feature">
              <CardIcon variant="primary">
                <Zap className="w-6 h-6" />
              </CardIcon>
              <CardHeader>
                <CardTitle>Feature Card</CardTitle>
                <CardDescription>
                  With icon container
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary-dark">
                  Features a prominent icon container for visual emphasis.
                </p>
              </CardContent>
            </Card>

            {/* Interactive Card */}
            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Interactive Card</CardTitle>
                <CardDescription>
                  Enhanced glow on hover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary-dark">
                  Hover over this card to see the enhanced glow effect and scale animation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Tags Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Tags
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Filled Tags</h3>
              <TagGroup>
                <Tag variant="primary">Primary</Tag>
                <Tag variant="accent">Accent</Tag>
                <Tag variant="quantum">Quantum</Tag>
                <Tag variant="success">Success</Tag>
                <Tag variant="error">Error</Tag>
                <Tag variant="warning">Warning</Tag>
                <Tag variant="neutral">Neutral</Tag>
              </TagGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">Outlined Tags</h3>
              <TagGroup>
                <Tag variant="primary" outlined>Primary</Tag>
                <Tag variant="accent" outlined>Accent</Tag>
                <Tag variant="quantum" outlined>Quantum</Tag>
                <Tag variant="success" outlined>Success</Tag>
              </TagGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">With Icons & Remove</h3>
              <TagGroup>
                <Tag variant="primary" icon={<Star className="w-3 h-3" />}>
                  Featured
                </Tag>
                <Tag variant="accent" removable onRemove={() => {}}>
                  Removable
                </Tag>
                <Tag variant="success" icon={<Zap className="w-3 h-3" />} outlined>
                  Active
                </Tag>
              </TagGroup>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">Sizes</h3>
              <TagGroup>
                <Tag size="sm">Small</Tag>
                <Tag size="md">Medium</Tag>
                <Tag size="lg">Large</Tag>
              </TagGroup>
            </div>
          </div>
        </section>

        {/* Progress Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Progress Indicators
          </h2>
          <div className="space-y-8">
            {/* Linear Progress */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Linear Progress</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary-dark mb-2">Primary (65%)</p>
                  <Progress value={progress} showValue />
                </div>
                <div>
                  <p className="text-sm text-text-secondary-dark mb-2">Accent (40%)</p>
                  <Progress value={40} variant="accent" />
                </div>
                <div>
                  <p className="text-sm text-text-secondary-dark mb-2">Success (85%)</p>
                  <Progress value={85} variant="success" size="lg" />
                </div>
              </div>
            </div>

            {/* Circular Progress */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Circular Progress</h3>
              <div className="flex gap-8">
                <div>
                  <CircularProgress value={75} size={100} />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Primary</p>
                </div>
                <div>
                  <CircularProgress value={60} variant="accent" size={100} />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Accent</p>
                </div>
                <div>
                  <CircularProgress value={90} variant="success" size={100} />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Success</p>
                </div>
              </div>
            </div>

            {/* Spinners */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Loading Spinners</h3>
              <div className="flex gap-8 items-center">
                <div>
                  <Spinner size="sm" />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Small</p>
                </div>
                <div>
                  <Spinner size="md" />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Medium</p>
                </div>
                <div>
                  <Spinner size="lg" />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">Large</p>
                </div>
                <div>
                  <Spinner size="xl" variant="accent" />
                  <p className="text-sm text-text-secondary-dark text-center mt-2">XL Accent</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Empty States Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Empty States
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card variant="cosmic">
              <NoResults searchTerm="test query" onClear={() => {}} />
            </Card>

            <Card variant="cosmic">
              <NoData onCreate={() => {}} createLabel="Create Item" />
            </Card>

            <Card variant="cosmic">
              <ErrorState onRetry={() => {}} />
            </Card>

            <Card variant="cosmic">
              <EmptyState
                icon={<FileText className="w-8 h-8" />}
                title="Custom Empty State"
                description="You can create custom empty states with any icon and content."
                actionLabel="Learn More"
                onAction={() => {}}
              />
            </Card>
          </div>
        </section>

        {/* Modal Section */}
        <section>
          <h2 className="text-2xl font-primary font-semibold text-white mb-6">
            Modal
          </h2>
          <div className="space-y-4">
            <Button onClick={() => setModalOpen(true)}>
              Open Modal Demo
            </Button>

            <Modal
              isOpen={modalOpen}
              onClose={() => setModalOpen(false)}
              title="Example Modal"
              size="md"
            >
              <div className="space-y-4">
                <p className="text-text-secondary-dark">
                  This is an example modal with ORIZON cosmic styling. It features a dark background,
                  smooth animations, and keyboard/backdrop close support.
                </p>

                <Input
                  label="Example Input"
                  placeholder="Type something..."
                />

                <Textarea
                  label="Example Textarea"
                  placeholder="Enter details..."
                  rows={3}
                />
              </div>

              <ModalFooter>
                <Button variant="ghost" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setModalOpen(false)}>
                  Confirm
                </Button>
              </ModalFooter>
            </Modal>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-dark bg-surface-dark mt-24">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-text-muted-dark">
          <p>ORIZON Design System • Phase 2 Complete</p>
        </div>
      </footer>
    </div>
  );
}
