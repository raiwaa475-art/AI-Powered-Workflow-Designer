import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TabBar } from '../components/archivex/TabBar';
import { Sidebar } from '../components/archivex/Sidebar';
import { Tab, Agent } from '../components/archivex/types';
import { SavedSession, WorkflowData } from '../types';
import { SettingsModal } from '../components/SettingsModal';
import { StackSelectorModal } from '../components/StackSelectorModal';
import { AgentGrid } from '../components/archivex/AgentGrid';
import { Topbar } from '../components/archivex/Topbar';

describe('UI Component Test Suite', () => {
  // Mock JSDOM lack of scrollIntoView implementation
  beforeAll(() => {
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    if (!window.fetch) {
      window.fetch = jest.fn() as unknown as typeof fetch;
    }
  });

  // Mock data for TabBar
  const mockTabs: Tab[] = [
    { id: 'business', label: 'Business Flow', icon: 'ti-layout-grid' },
    { id: 'architecture', label: 'Tech Topology', icon: 'ti-network' },
    { id: 'simulation', label: 'Live Simulation', icon: 'ti-player-play' },
  ];

  describe('TabBar Component', () => {
    it('renders all tabs and highlights the active one', () => {
      const mockOnChange = jest.fn();
      const mockOnLanguageChange = jest.fn();

      render(
        <TabBar
          tabs={mockTabs}
          activeTab="architecture"
          onChange={mockOnChange}
          language="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );

      // Verify tabs are rendered
      expect(screen.getByText('Business Flow')).toBeInTheDocument();
      expect(screen.getByText('Tech Topology')).toBeInTheDocument();
      expect(screen.getByText('Live Simulation')).toBeInTheDocument();

      // Verify the active tab styling (contains active border-[#534AB7] classes)
      const activeTabButton = screen.getByText('Tech Topology').closest('button');
      expect(activeTabButton).toHaveClass('border-[#534AB7]');
      expect(activeTabButton).toHaveClass('text-[#534AB7]');
    });

    it('triggers onChange when tab button is clicked', () => {
      const mockOnChange = jest.fn();
      const mockOnLanguageChange = jest.fn();

      render(
        <TabBar
          tabs={mockTabs}
          activeTab="business"
          onChange={mockOnChange}
          language="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );

      // Click on "Live Simulation" tab
      const simTab = screen.getByText('Live Simulation');
      fireEvent.click(simTab);

      expect(mockOnChange).toHaveBeenCalledWith('simulation');
    });

    it('renders the TH/EN toggle and handles language change', () => {
      const mockOnChange = jest.fn();
      const mockOnLanguageChange = jest.fn();

      const { rerender } = render(
        <TabBar
          tabs={mockTabs}
          activeTab="business"
          onChange={mockOnChange}
          language="en"
          onLanguageChange={mockOnLanguageChange}
        />
      );

      // Verify TH and EN buttons are present
      const thBtn = screen.getByText('TH');
      const enBtn = screen.getByText('EN');
      expect(thBtn).toBeInTheDocument();
      expect(enBtn).toBeInTheDocument();

      // In EN mode, EN should be highlighted with text-white and bg-[#534AB7]
      expect(enBtn).toHaveClass('bg-[#534AB7]');
      expect(enBtn).toHaveClass('text-white');
      expect(thBtn).toHaveClass('text-[var(--color-text-muted)]');

      // Click on TH
      fireEvent.click(thBtn);
      expect(mockOnLanguageChange).toHaveBeenCalledWith('th');

      // Re-render with TH language state to check active styles
      rerender(
        <TabBar
          tabs={mockTabs}
          activeTab="business"
          onChange={mockOnChange}
          language="th"
          onLanguageChange={mockOnLanguageChange}
        />
      );

      const thBtnUpdated = screen.getByText('TH');
      const enBtnUpdated = screen.getByText('EN');
      expect(thBtnUpdated).toHaveClass('bg-[#534AB7]');
      expect(thBtnUpdated).toHaveClass('text-white');
      expect(enBtnUpdated).toHaveClass('text-[var(--color-text-muted)]');
    });
  });

  describe('Sidebar Component', () => {
    const mockBlueprint: WorkflowData = {
      title: 'E-Commerce Ticketing System',
      description: 'Distributed ticketing system matching production loads',
      layers: [],
      steps: [],
    };

    const mockSavedSessions: SavedSession[] = [
      {
        id: 'session-1',
        title: 'Session One',
        timestamp: Date.now(),
        prompt: 'Design a high load reservation booking API',
        language: 'en',
        blueprint: mockBlueprint,
        resiliency: null,
        scaleInfo: null,
        chatHistory: [],
      },
    ];

    const mockTokenUsage = {
      totalTokens: 15420,
      promptTokens: 10240,
      completionTokens: 5180,
    };

    const defaultProps = {
      activeId: 'overview',
      onChangeActiveId: jest.fn(),
      logs: ['✦ Core layout streaming initiated...', '✦ Analyzing nodes...'],
      blueprint: mockBlueprint,
      tokenUsage: mockTokenUsage,
      language: 'en' as const,
      onNew: jest.fn(),
      savedSessions: mockSavedSessions,
      onLoadSession: jest.fn(),
      onDeleteSession: jest.fn(),
      onSaveSession: jest.fn(),
      onApplyPreset: jest.fn(),
    };

    it('renders navigation sections and active project title', () => {
      render(<Sidebar {...defaultProps} />);

      // Verify brand headers and project title
      expect(screen.getByText('Archivex AI')).toBeInTheDocument();
      expect(screen.getByText('Multi-Agent Studio')).toBeInTheDocument();
      expect(screen.getByText('Active Project')).toBeInTheDocument();
      expect(screen.getByText('E-Commerce Ticketing System')).toBeInTheDocument();

      // Verify sections are visible
      expect(screen.getByText('Workspace')).toBeInTheDocument();
      expect(screen.getByText('Agents')).toBeInTheDocument();
      expect(screen.getByText('Output')).toBeInTheDocument();
    });

    it('supports localization toggling correctly in Sidebar text', () => {
      const { rerender } = render(<Sidebar {...defaultProps} language="en" />);

      // EN texts
      expect(screen.getByText('New System Design')).toBeInTheDocument();
      expect(screen.getByText('Active Project')).toBeInTheDocument();
      expect(screen.getByText('Quick Presets')).toBeInTheDocument();
      expect(screen.getByText('1M Concert Tickets')).toBeInTheDocument();
      expect(screen.getByText('Saved Sessions')).toBeInTheDocument();

      // Switch to TH
      rerender(<Sidebar {...defaultProps} language="th" />);

      // TH texts
      expect(screen.getByText('ออกแบบระบบใหม่')).toBeInTheDocument();
      expect(screen.getByText('โปรเจกต์ที่เปิดอยู่')).toBeInTheDocument();
      expect(screen.getByText('เทมเพลตด่วน')).toBeInTheDocument();
      expect(screen.getByText('จองตั๋วคอนเสิร์ต 1M')).toBeInTheDocument();
      expect(screen.getByText('เซสชันที่บันทึก')).toBeInTheDocument();
    });

    it('triggers callback when presets, sessions, or load buttons are clicked', () => {
      const mockApplyPreset = jest.fn();
      const mockLoadSession = jest.fn();
      const mockDeleteSession = jest.fn();

      render(
        <Sidebar
          {...defaultProps}
          onApplyPreset={mockApplyPreset}
          onLoadSession={mockLoadSession}
          onDeleteSession={mockDeleteSession}
        />
      );

      // Trigger apply preset click
      const presetBtn = screen.getByText('1M Concert Tickets');
      fireEvent.click(presetBtn);
      expect(mockApplyPreset).toHaveBeenCalledWith('concert-booking-1m');

      // Trigger session load click
      const sessionLoadBtn = screen.getByText('Session One');
      fireEvent.click(sessionLoadBtn);
      expect(mockLoadSession).toHaveBeenCalled();

      // Trigger session delete click
      const trashIcon = screen.getByTitle('Delete');
      fireEvent.click(trashIcon);
      expect(mockDeleteSession).toHaveBeenCalledWith('session-1');
    });

    it('renders real-time token tracking stats correctly', () => {
      render(<Sidebar {...defaultProps} />);

      // Total token badge
      expect(screen.getByText('Tokens: 15,420')).toBeInTheDocument();
    });
  });

  describe('SettingsModal Component', () => {
    beforeEach(() => {
      window.fetch = jest.fn().mockImplementation((url) => {
        if (typeof url === 'string' && url.includes('/api/get-provider')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ configured: true, provider: 'deepseek', maskedKey: 'deep••••••••2026' }),
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true }),
        } as Response);
      });
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(<SettingsModal isOpen={false} onClose={jest.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders configuration parameters when open', async () => {
      render(<SettingsModal isOpen={true} onClose={jest.fn()} />);

      expect(screen.getByText('Engine Settings')).toBeInTheDocument();
      
      // Wait for fetch callback update
      await waitFor(() => {
        expect(screen.getByText(/Active:/)).toBeInTheDocument();
        expect(screen.getByText('deepseek')).toBeInTheDocument();
        expect(screen.getByText(/deep••••••••2026/)).toBeInTheDocument();
      });
      
      expect(screen.getByText('Model Provider')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('sk-...')).toBeInTheDocument();
    });

    it('handles close callback on click', () => {
      const mockClose = jest.fn();
      render(<SettingsModal isOpen={true} onClose={mockClose} />);

      const closeBtn = screen.getByText('Close');
      fireEvent.click(closeBtn);
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('StackSelectorModal Component', () => {
    const mockBlueprint: WorkflowData = {
      title: 'Concert Booking Service',
      description: 'Ingestion server for ticket seat lock processing',
      layers: [],
      steps: []
    };

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <StackSelectorModal
          isOpen={false}
          onClose={jest.fn()}
          blueprint={mockBlueprint}
          onSelectStack={jest.fn()}
          language="en"
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders stack selections and highlights smart recommendations (Go Gin for concert spikes)', () => {
      const mockSelect = jest.fn();
      render(
        <StackSelectorModal
          isOpen={true}
          onClose={jest.fn()}
          blueprint={mockBlueprint}
          onSelectStack={mockSelect}
          language="en"
        />
      );

      // Verify header systems
      expect(screen.getByText('Choose Your Target Backend Stack')).toBeInTheDocument();
      
      // Verify Go Gin recommendation tag is highlighted
      expect(screen.getByText('RECOMMENDED FOR YOU')).toBeInTheDocument();
      expect(screen.getByText('Go (Gin) + PostgreSQL + Redis')).toBeInTheDocument();

      // Click on Node.js Stack option
      const nodeOption = screen.getByText('Node.js (Express) + MongoDB + Redis');
      fireEvent.click(nodeOption);
      
      expect(mockSelect).toHaveBeenCalledWith('node-express');
    });

    it('renders bilingual Thai descriptions when active language is th', () => {
      render(
        <StackSelectorModal
          isOpen={true}
          onClose={jest.fn()}
          blueprint={mockBlueprint}
          onSelectStack={jest.fn()}
          language="th"
        />
      );

      expect(screen.getByText('เลือกโครงสร้างภาษาและฐานข้อมูล (Backend Stacks Catalog)')).toBeInTheDocument();
      expect(screen.getByText('แนะนำสำหรับผังระบบนี้')).toBeInTheDocument();
      expect(screen.getAllByText('ประสิทธิภาพ:')[0]).toBeInTheDocument();
    });
  });

  describe('AgentGrid Component', () => {
    const mockAgents: Agent[] = [
      {
        id: 'blueprint',
        name: 'Blueprint Agent',
        description: 'Generates system layers',
        status: 'active',
        icon: 'ti-sitemap',
        color: '#534AB7',
        iconTint: 'rgba(83, 74, 183, 0.15)',
      },
      {
        id: 'resiliency',
        name: 'Resiliency Agent',
        description: 'Scans for risks',
        status: 'inactive',
        icon: 'ti-shield-check',
        color: '#22d3ee',
        iconTint: 'rgba(34, 211, 238, 0.14)',
      }
    ];

    it('renders all SaaS agents inside the workspace grid with active indicators', () => {
      const mockSelectAgent = jest.fn();
      render(
        <AgentGrid
          agents={mockAgents}
          activeAgentId="blueprint"
          onSelectAgent={mockSelectAgent}
        />
      );

      // Verify agents titles and descriptions
      expect(screen.getByText('Blueprint Agent')).toBeInTheDocument();
      expect(screen.getByText('Generates system layers')).toBeInTheDocument();
      expect(screen.getByText('Resiliency Agent')).toBeInTheDocument();
      expect(screen.getByText('Scans for risks')).toBeInTheDocument();

      // Per-card status labels are intentionally hidden; active state is visual.
      expect(screen.queryByText('Active')).not.toBeInTheDocument();
      expect(screen.queryByText('Idle')).not.toBeInTheDocument();
      expect(screen.getByText('Blueprint Agent').closest('.hud-agent-card')).toHaveClass('hud-agent-active');

      // Select idle agent
      const resiliencyCard = screen.getByText('Resiliency Agent').closest('div');
      if (resiliencyCard) {
        fireEvent.click(resiliencyCard);
        expect(mockSelectAgent).toHaveBeenCalledWith('resiliency');
      }
    });
  });

  describe('Topbar Component', () => {
    const mockTokenUsage = {
      totalTokens: 25000,
      promptTokens: 15000,
      completionTokens: 10000
    };

    const mockBlueprint = {
      title: 'Space-Age Orchestration System'
    };

    it('renders main topbar controls, active system details, and token usage values', () => {
      const mockNew = jest.fn();
      const mockSettings = jest.fn();
      const mockReverse = jest.fn();

      render(
        <Topbar
          title="Multiplayer Studio Workspace"
          tokenUsage={mockTokenUsage}
          language="en"
          onNew={mockNew}
          onSettingsOpen={mockSettings}
          onReverseOpen={mockReverse}
          onChatOpen={jest.fn()}
          blueprint={mockBlueprint}
        />
      );

      // Section titles and badges
      expect(screen.getByText('Multiplayer Studio Workspace')).toBeInTheDocument();
      expect(screen.getByText('Space-Age Orchestration System')).toBeInTheDocument();
      expect(screen.getByText('Tokens: 25,000')).toBeInTheDocument();

      // Action button interactions
      const newBtn = screen.getByText('New Blueprint');
      fireEvent.click(newBtn);
      expect(mockNew).toHaveBeenCalled();

      const reverseBtn = screen.getByText('Reverse Code');
      fireEvent.click(reverseBtn);
      expect(mockReverse).toHaveBeenCalled();

      const settingsBtn = screen.getByTitle('Settings');
      fireEvent.click(settingsBtn);
      expect(mockSettings).toHaveBeenCalled();
    });

    it('renders Thai labels on Topbar action triggers in Thai mode', () => {
      render(
        <Topbar
          title="หน้าเวิร์กสเปซจำลองระบบ"
          tokenUsage={mockTokenUsage}
          language="th"
          onNew={jest.fn()}
          onSettingsOpen={jest.fn()}
          onReverseOpen={jest.fn()}
          onChatOpen={jest.fn()}
          blueprint={mockBlueprint}
        />
      );

      expect(screen.getByText('ถอดรหัสโค้ด')).toBeInTheDocument();
      expect(screen.getByText('สร้างใหม่')).toBeInTheDocument();
    });
  });
});
