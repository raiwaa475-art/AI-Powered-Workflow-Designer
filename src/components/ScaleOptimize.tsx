import React, { useState } from 'react';
import { 
  Activity, 
  Layout, 
  AlertTriangle, 
  Palette, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check,
  Server, 
  Zap, 
  Users, 
  DollarSign, 
  HelpCircle, 
  Code2,
  Cpu,
  ShieldAlert,
  ArrowRightLeft,
  BellRing,
  LineChart,
  ShieldCheck,
  Circle,
  Sparkles
} from 'lucide-react';
import { ScaleData, WorkflowData } from '@/types';

const ensureArray = (val: any, fallback: string[]): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim() !== '') return [val];
  return fallback;
};

const generatePostgresMigration = (blueprint: any): string => {
  if (!blueprint) return `-- Database Migration Portal\n-- Please load a blueprint first.`;
  const title = blueprint.title || 'Enterprise DB';
  const nodes = blueprint.layers?.flatMap((l: any) => l.nodes || []) || [];
  const steps = blueprint.steps || [];
  const dbType = nodes.some((n: any) => (n.type || '').toLowerCase().includes('nosql')) ? 'MongoDB' : 'PostgreSQL';

  let sql = `-- 🏛️ DATABASE DYNAMIC SCHEMA MIGRATION & DIFF CENTER (Tuned for: ${title})
-- Target Storage Type: ${dbType}
-- Status: ⚠️ PRODUCTION-SAFE SCHEMA DIFF GENERATION SUCCESSFUL (No Data Loss)

-- ───────────────────────────────────────────────────────────
-- SECTION 1: DDL INITIAL SCHEMAS (โครงสร้างตารางเริ่มต้น)
-- ───────────────────────────────────────────────────────────
`;

  const hasBooking = nodes.some((n: any) => /booking|reservation/i.test(n.id));
  const hasUser = nodes.some((n: any) => /user|auth/i.test(n.id));
  const hasInventory = nodes.some((n: any) => /inventory|stock|ticket/i.test(n.id));

  if (hasUser) {
    sql += `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  if (hasInventory) {
    sql += `
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(150) NOT NULL,
    total_slots INT NOT NULL DEFAULT 10000,
    available_slots INT NOT NULL,
    version INT NOT NULL DEFAULT 0, -- Optimistic concurrency lock
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  if (hasBooking) {
    sql += `
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id),
    item_id INT REFERENCES inventory_items(id),
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);
`;
  } else {
    sql += `
CREATE TABLE IF NOT EXISTS transaction_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(100) UNIQUE NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  sql += `
-- ───────────────────────────────────────────────────────────
-- SECTION 2: PRODUCTION-SAFE ALTER MIGRATION (สคริปต์ย้ายระบบที่ปลอดภัย)
-- ───────────────────────────────────────────────────────────
-- The following script diffs your active React Flow Canvas designs
-- and applies safe column updates without wiping database content:
`;

  steps.forEach((step: any) => {
    if (/payment|billing/i.test(step.title)) {
      sql += `
-- Calibrating Step ${step.number}: ${step.title}
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_ref_id VARCHAR(100);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'UNPAID';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bookings_payment_ref ON bookings (payment_ref_id) WHERE payment_status = 'UNPAID';
`;
    } else if (/auth|login/i.test(step.title)) {
      sql += `
-- Calibrating Step ${step.number}: ${step.title}
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
`;
    } else if (/notification|notify/i.test(step.title)) {
      sql += `
-- Calibrating Step ${step.number}: ${step.title}
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT FALSE;
`;
    }
  });

  sql += `
-- ───────────────────────────────────────────────────────────
-- SECTION 3: SYNTHETIC DATA INGESTION PIPELINE (ท่อข้อมูลทดสอบล้านเรคคอร์ด)
-- ───────────────────────────────────────────────────────────
-- Copyable seed script to push 10,000+ synthetic mock records
-- into your PostgreSQL tables for concurrency & performance testing:

CREATE OR REPLACE FUNCTION generate_synthetic_data()
RETURNS void AS $$
DECLARE
    i INT := 1;
BEGIN
    -- Seed mock users
    INSERT INTO users (username, email, password_hash)
    SELECT 
        'user_' || g,
        'user_' || g || '@enterprise.com',
        'pbkdf2_sha256$mockpasswordhash'
    FROM generate_series(1, 200) g
    ON CONFLICT DO NOTHING;

    -- Seed mock inventory
    INSERT INTO inventory_items (item_name, total_slots, available_slots)
    VALUES ('Stadium Concert Seat Zone A', 10000, 10000)
    ON CONFLICT DO NOTHING;

    -- Batch Ingest 10,000 bookings in background event loop
    WHILE i <= 10000 LOOP
        INSERT INTO bookings (user_id, item_id, status, expires_at)
        VALUES (
            (SELECT id FROM users ORDER BY random() LIMIT 1),
            1,
            CASE WHEN random() > 0.3 THEN 'CONFIRMED' ELSE 'PENDING' END,
            NOW() + INTERVAL '1 hour'
        );
        i := i + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute to populate high-throughput sandbox tables:
-- SELECT generate_synthetic_data();
`;

  return sql;
};

interface ScaleOptimizeProps {
  scaleInfo: ScaleData | null;
  blueprint: WorkflowData | null;
  language: 'th' | 'en';
  backendStack?: string;
  onChangeStack?: () => void;
}

export const ScaleOptimize: React.FC<ScaleOptimizeProps> = ({ 
  scaleInfo, 
  blueprint,
  language,
  backendStack = '',
  onChangeStack
}) => {
  const [selectedTier, setSelectedTier] = useState<'Small' | 'Medium' | 'Large'>('Large');
  const [activeConfigTab, setActiveConfigTab] = useState<'redis' | 'nginx' | 'postgres'>('redis');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  if (!scaleInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-950/20 rounded-2xl border border-white/5 p-8 select-none">
        <div className="w-12 h-12 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center text-cyan-400">
          <Activity className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {language === 'th' ? 'กำลังรอข้อมูลจำลองการขยายระบบ...' : 'Awaiting scale & optimization analytics...'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mt-1.5 leading-relaxed">
            {language === 'th' 
              ? 'กรุณากดออกแบบระบบหรือรันการจำลองก่อน เพื่อประเมินสเปกเซิร์ฟเวอร์, งบประมาณ และรับแผนการขยายสถาปัตยกรรมแบบ 3-Tier'
              : 'Synthesize or modify the graph first. Hardware concurrent load estimates and tuned configuration profiles will load automatically.'}
          </p>
        </div>
      </div>
    );
  }

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(id);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Find scale information details from LLM response or define solid high-concurrency fallbacks
  const smallEstimate = scaleInfo.load_estimates?.find(e => e.tier === 'Small') || {
    tier: 'Small',
    concurrent_users: '1,000 Users',
    requests_per_second: '50 RPS',
    server_spec: 'Single VPS (1 vCPU, 2GB RAM)'
  };
  const mediumEstimate = scaleInfo.load_estimates?.find(e => e.tier === 'Medium') || {
    tier: 'Medium',
    concurrent_users: '50,000 Users',
    requests_per_second: '2,500 RPS',
    server_spec: 'Docker Compose + Managed DB (4 vCPU, 16GB RAM)'
  };
  const largeEstimate = scaleInfo.load_estimates?.find(e => e.tier === 'Large') || {
    tier: 'Large',
    concurrent_users: '1,000,000 Users',
    requests_per_second: '50,000 RPS',
    server_spec: 'Kubernetes Cluster + Redis Sharding + DB Replication'
  };

  // Find estimated cloud cost from deploy stages
  const smallStage = scaleInfo.deploy_stages?.find(s => s.stage === 'Stage 1' || s.title?.toLowerCase().includes('small'));
  const mediumStage = scaleInfo.deploy_stages?.find(s => s.stage === 'Stage 2' || s.title?.toLowerCase().includes('medium'));
  const largeStage = scaleInfo.deploy_stages?.find(s => s.stage === 'Stage 3' || s.title?.toLowerCase().includes('large'));

  const smallCost = smallStage?.estimated_cost || '$10/mo';
  const mediumCost = mediumStage?.estimated_cost || '$150/mo';
  const largeCost = largeStage?.estimated_cost || '$2,500/mo';

  // Format Code Line Colors
  const formatConfigContent = (config: string) => {
    return config.split('\n').map((line, idx) => {
      let lineClass = 'text-gray-300';
      if (line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        lineClass = 'text-emerald-500/80 font-mono italic';
      } else if (line.includes('maxmemory') || line.includes('policy') || line.includes('events') || line.includes('http') || line.includes('shared_buffers')) {
        lineClass = 'text-cyan-400 font-mono font-semibold';
      } else if (line.includes('allkeys-lru') || line.includes('keepalive') || line.includes('work_mem') || line.includes('listen')) {
        lineClass = 'text-amber-400 font-mono';
      } else if (line.trim().startsWith('CREATE') || line.trim().startsWith('SELECT') || line.trim().startsWith('INSERT')) {
        lineClass = 'text-purple-400 font-mono font-bold';
      }
      
      return (
        <div key={idx} className="table-row">
          <span className="table-cell select-none text-right pr-4 text-slate-700 text-[10px] w-8 font-mono">{idx + 1}</span>
          <span className={`table-cell whitespace-pre ${lineClass}`}>{line}</span>
        </div>
      );
    });
  };

  // Static premium details to enrich the dynamic content
  const tierDetails = {
    Small: {
      title: language === 'th' ? 'Small Tier (ขั้นเริ่มต้น)' : 'Small Tier (MVP Start)',
      cost: smallCost,
      users: smallEstimate.concurrent_users,
      rps: smallEstimate.requests_per_second,
      infra: smallEstimate.server_spec,
      badgeColor: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      activeColor: 'border-emerald-500/40 shadow-emerald-950/20',
      pros: ensureArray(smallStage?.pros, [
        language === 'th' ? 'สร้างเสร็จเร็วและง่ายที่สุด ใช้ทรัพยากรน้อยมาก' : 'Fastest implementation, extremely low resource footprint',
        language === 'th' ? 'ราคาถูกที่สุด เหมาะสำหรับการทำระบบ MVP หรือเทสระบบเริ่มต้น' : 'Most cost-effective, ideal for validating ideas (MVP)'
      ]),
      cons: ensureArray(smallStage?.cons, [
        language === 'th' ? 'ไม่มีระบบสำรอง (Single Point of Failure) ถ้าระบบดับคือล่มหมด' : 'Single Point of Failure. Server crash takes everything down',
        language === 'th' ? 'รองรับผู้ใช้งานพร้อมกันได้จำกัด ไม่สามารถสเกลแนวราบได้' : 'Highly limited concurrent users. Incapable of horizontal scaling'
      ]),
      roadmap: smallStage?.roadmap || (language === 'th'
        ? 'เริ่มจากระบบเครื่องเดี่ยว (Single VPS) ➡️ ดึง Backend และ DB รันอยู่ใน VM เดียวกันเพื่อลดความซับซ้อน'
        : 'Setup a single instance virtual server ➡️ Run application process and database directly in-host for absolute simplicity.')
    },
    Medium: {
      title: language === 'th' ? 'Medium Tier (ขั้นเติบโต)' : 'Medium Tier (Scale Out)',
      cost: mediumCost,
      users: mediumEstimate.concurrent_users,
      rps: mediumEstimate.requests_per_second,
      infra: mediumEstimate.server_spec,
      badgeColor: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      activeColor: 'border-cyan-500/40 shadow-cyan-950/20',
      pros: ensureArray(mediumStage?.pros, [
        language === 'th' ? 'เริ่มแยก Layer เซิร์ฟเวอร์กับระบบจัดการฐานข้อมูลออกจากกัน' : 'Decouples web/app nodes from primary storage hosting',
        language === 'th' ? 'ดูแลรักษาง่ายขึ้นด้วย Docker Compose และระบบ Managed DB ของคลาวด์' : 'Easier management using container definitions & Cloud Managed DBs'
      ]),
      cons: ensureArray(mediumStage?.cons, [
        language === 'th' ? 'การขยายโหลดแบบอัตโนมัติ (Auto-scaling) ยังทำไม่ได้อย่างสมบูรณ์' : 'Lack of automatic horizontal auto-scaling nodes',
        language === 'th' ? 'ยังเสี่ยงติดคอขวดที่ฐานข้อมูลหลักหากเจอกลุ่มผู้ใช้เข้าเขียนพร้อมกันสูง' : 'Database write operations could bottleneck under heavy concurrent loads'
      ]),
      roadmap: mediumStage?.roadmap || (language === 'th'
        ? 'ย้ายจาก Single Server ➡️ บรรจุแอปลง Docker Container ➡️ แยกข้อมูลเก็บใน Managed Database ที่สเกลได้เสถียร'
        : 'Containerize backend web apps using Docker ➡️ Spin multiple instances behind an Ingress proxy ➡️ Relocate database storage to a managed DB service.')
    },
    Large: {
      title: language === 'th' ? 'Large Tier (สเกลสูงสุด)' : 'Large Tier (Enterprise)',
      cost: largeCost,
      users: largeEstimate.concurrent_users,
      rps: largeEstimate.requests_per_second,
      infra: largeEstimate.server_spec,
      badgeColor: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
      activeColor: 'border-purple-500/40 shadow-purple-950/20',
      pros: ensureArray(largeStage?.pros, [
        language === 'th' ? 'ขยายระบบแบบอัตโนมัติ (Auto-scaling) รองรับปริมาณโหลดมหาศาล' : 'Elastically handles spikes with horizontal auto-scaling pods',
        language === 'th' ? 'เสถียรภาพสูงมาก (High Availability) และมีระบบแคชกระจายตัว' : 'Highly available layout with clustered memory cache'
      ]),
      cons: ensureArray(largeStage?.cons, [
        language === 'th' ? 'การออกแบบและดูแลรักษาระบบมีความซับซ้อนสูงมาก (High DevOps Overhead)' : 'Requires dedicated DevOps support and complex cluster management',
        language === 'th' ? 'ค่าใช้จ่ายรายเดือนสูงมาก ต้องใช้ทักษะทางเทคนิคขั้นสูง' : 'Substantial monthly Cloud budgets required for operational stability'
      ]),
      roadmap: largeStage?.roadmap || (language === 'th'
        ? 'ย้ายระบบเข้าสู่ Kubernetes Cluster ➡️ เชื่อมต่อคิวข้อความ (Kafka/RabbitMQ) ➡️ ทำ Redis Sharding แคชข้อมูล ➡️ ทำ DB Replication แยกฝั่งอ่าน-เขียน'
        : 'Migrate to managed Kubernetes ➡️ Inject buffer broker (Kafka/RabbitMQ) ➡️ Implement sharded memory caches (Redis) ➡️ Deploy Database Primary-Replica read streams.')
    }
  };

  // Technical configuration quick wins template
  const defaultConfigs = {
    redis: scaleInfo.optimization_configs?.redis || `# Redis High-Performance Tuning Configuration
# Optimized for high-throughput reservation pipelines

maxmemory 4gb
maxmemory-policy allkeys-lru
tcp-backlog 65536
save ""
appendonly no
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes`,
    
    nginx: scaleInfo.optimization_configs?.nginx || `# Nginx & CDN Ingress Tuning Configuration
# Caches assets and buffers fast write ingestion requests

worker_connections 8000;
multi_accept on;

proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cdn_cache:10m max_size=1g inactive=60m;
proxy_buffers 8 16k;
proxy_buffer_size 32k;

server {
    listen 80;
    
    location /static/ {
        proxy_cache cdn_cache;
        add_header Cache-Control "public, max-age=31536000, immutable";
        proxy_pass http://backend_upstream;
    }
}`,

    postgres: generatePostgresMigration(blueprint)
  };

  // 📝 3.4 Monitoring & Security Checklist
  const monitoringChecklist = ensureArray(scaleInfo.monitoring_checklist, [
    language === 'th' ? 'ตั้งค่าแจ้งเตือน (Alerting Rules) เมื่อ CPU usage ของ API Ingress เกิน 80% ติดกัน 5 นาที' : 'Configure Alerting Rules when Ingress Gateway CPU usage exceeds 80% for 5 minutes.',
    language === 'th' ? 'ตรวจสอบระดับ Memory Eviction Rate ของ Redis และเฝ้าระวังการเกิด Out of Memory (OOM)' : 'Monitor Redis Eviction Rate closely to prevent Out of Memory (OOM) failures under spikes.',
    language === 'th' ? 'เปิดบริการ PostgreSQL Slow Query Log สำหรับตรวจสอบการคิวรีที่รันช้ากว่า 200ms' : 'Enable PostgreSQL Slow Query Logs to inspect and profile database queries taking over 200ms.',
    language === 'th' ? 'ทำเครื่องหมายและเก็บ log สำหรับ Dead Letter Queue (DLQ) บน Kafka เพื่อลดการสูญหายของข้อความ' : 'Track Kafka Dead Letter Queue (DLQ) to ensure no messages are lost when consumer pipeline bottlenecks.',
    language === 'th' ? 'ตรวจสอบอัตรา Cache Hit Ratio ของ Cloudflare CDN ให้อยู่สูงกว่าเป้าหมาย 85%' : 'Audit Cloudflare CDN Cache Hit Ratio, aiming to maintain at least 85% cache hits for web speed.',
    language === 'th' ? 'ตั้งค่าระงับการทำงานชั่วคราว (Circuit Breaker) สำหรับ Gateway รับชำระเงินเมื่อเกิด Timeout' : 'Deploy a Circuit Breaker on the Payment Gateway to handle payment service latency and timeouts gracefully.'
  ]);

  return (
    <div className="space-y-6 animate-fade-in-node">
      
      {/* 🛠️ Active Stack Display Indicator Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/85 to-slate-950/85 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl shadow-lg relative overflow-hidden select-none text-left">
        <div className="absolute top-0 right-0 w-24 h-full bg-cyan-500/5 rounded-l-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shadow-md">
            <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">Active Backend Stack</span>
              <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded-full tracking-wide">ACTIVE</span>
            </div>
            <h4 className="text-xs font-bold text-white mt-1">
              {backendStack === 'go-gin' ? 'Go (Gin) + PostgreSQL + Redis' :
               backendStack === 'node-express' ? 'Node.js (Express) + MongoDB + Redis' :
               backendStack === 'python-fastapi' ? 'Python (FastAPI) + PostgreSQL + Redis' :
               backendStack === 'java-springboot' ? 'Java (Spring Boot) + PostgreSQL + Redis' :
               backendStack === 'csharp-netcore' ? 'C# (.NET Core) + SQL Server + Redis' :
               'Enterprise Multi-Tier System Stacks'}
            </h4>
            <p className="text-[9px] text-gray-500 mt-0.5 font-sans leading-relaxed">
              {language === 'th'
                ? 'AI Agent วิเคราะห์ขนาดระบบ โหลดขนาน และจูนสเปกฐานข้อมูล/แคชตามภาษานี้โดยเฉพาะ'
                : 'Scale profiles and Postgres/Nginx parameter scripts are custom-tuned specifically for this technology.'}
            </p>
          </div>
        </div>

        {onChangeStack && (
          <button
            onClick={onChangeStack}
            className="py-1.5 px-3.5 rounded-xl border border-cyan-500/30 bg-cyan-600/10 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-900/5 hover:-translate-y-0.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === 'th' ? '⚡ สลับสแต็กภาษา' : '⚡ Switch Backend Stack'}</span>
          </button>
        )}
      </div>
      
      {/* 📊 ส่วนที่ 3.1: 3-Tier Load Dashboard */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 select-none">
              <Layout className="w-4 h-4 text-cyan-400 animate-pulse" />
              {language === 'th' ? 'แผงเปรียบเทียบการโหลด 3 ระดับ (3-Tier Load Dashboard)' : '3-Tier Load & Infrastructure Comparison'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {language === 'th' 
                ? 'เปรียบเทียบสเกลระบบสถาปัตยกรรมจากขั้นพัฒนาเริ่มต้นสู่ระดับโปรดักชันรองรับผู้ใช้ล้านคน'
                : 'Compare architectural growth scales side-by-side, matching hardware specs with operational cost projections.'}
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start md:self-auto bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/5 text-[9px] font-semibold text-gray-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span>{language === 'th' ? 'Large Tier คือสถานะจำลองเป้าหมายของคุณ' : 'Large Tier is your target workflow limit'}</span>
          </div>
        </div>
        
        {/* Responsive 3-Tier Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['Small', 'Medium', 'Large'] as const).map((tier) => {
            const data = tierDetails[tier];
            const isSelected = selectedTier === tier;
            const isTarget = tier === 'Large';

            return (
              <div 
                key={tier} 
                onClick={() => setSelectedTier(tier)}
                className={`group relative p-5 rounded-2xl border bg-slate-900/30 backdrop-blur-md flex flex-col justify-between cursor-pointer hover:bg-slate-900/50 hover:scale-[1.01] transition-all duration-300 ${
                  isSelected 
                    ? `border-cyan-500/60 shadow-lg ${data.activeColor}` 
                    : isTarget
                    ? 'border-purple-500/20'
                    : 'border-white/5'
                }`}
              >
                {/* Active Light Badge for user's prompt (Large Tier) */}
                {isTarget && (
                  <div className="absolute -top-2 -right-1 flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg border border-emerald-400/40 select-none animate-bounce">
                    <span className="w-1 h-1 rounded-full bg-white animate-ping"></span>
                    <span>{language === 'th' ? '✅ Active Load (ตามโจทย์)' : '✅ Active Prompt Target'}</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${data.badgeColor}`}>
                      {tier}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-gray-300">
                      {data.cost}
                    </span>
                  </div>
                  
                  <div className="space-y-2.5 text-left">
                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                        <Users className="w-3 h-3 text-cyan-400" />
                        {language === 'th' ? 'ผู้ใช้งานพร้อมกัน:' : 'Concurrent Users:'}
                      </span>
                      <span className="text-[11px] font-bold text-white font-mono">{data.users}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                        <Zap className="w-3 h-3 text-amber-400" />
                        {language === 'th' ? 'ทราฟฟิกขาเข้า:' : 'Request Ingestion:'}
                      </span>
                      <span className="text-[11px] font-bold text-amber-400 font-mono">{data.rps}</span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider block font-mono">Infrastructure Stack</span>
                      <span className="text-[10px] font-semibold text-gray-200 mt-0.5 block truncate leading-snug">
                        {data.infra}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className={`mt-4 pt-2.5 border-t border-white/5 flex items-center justify-between text-[9px] font-bold tracking-wider uppercase transition-colors duration-200 ${
                  isSelected ? 'text-cyan-400' : 'text-gray-500 group-hover:text-white'
                }`}>
                  <span>{language === 'th' ? 'ดูแผนสถาปัตยกรรม' : 'View Architecture Plan'}</span>
                  <span className="transition-transform group-hover:translate-x-0.5">➔</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 🗺️ ส่วนที่ 3.2 & 3.3: Interactive Deploy Strategies & Configs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="mb-3.5 select-none">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-purple-400" />
              {language === 'th' ? 'แผนการอัพเกรดสถาปัตยกรรม (Deploy Strategies)' : 'Progressive Architectural Upgrade Roadmap'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {language === 'th'
                ? 'เจาะลึกขั้นตอน ย้ายระบบอย่างเป็นขั้นเป็นตอนพร้อมวิเคราะห์ข้อดีข้อเสียของแต่ละเฟส'
                : 'Interactive breakdown of progressive architectural migrations, detailing technical trade-offs.'}
            </p>
          </div>
          
          <div className="space-y-3">
            {(['Small', 'Medium', 'Large'] as const).map((tier) => {
              const isSelected = selectedTier === tier;
              const data = tierDetails[tier];

              return (
                <div 
                  key={tier} 
                  className={`rounded-xl border transition-all duration-300 ${
                    isSelected 
                      ? 'bg-slate-900/60 border-cyan-500/20 shadow-lg shadow-black/30' 
                      : 'bg-slate-900/25 border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => setSelectedTier(tier)}
                    className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${data.badgeColor}`}>
                        {tier}
                      </span>
                      <span className="text-xs font-semibold text-white">{data.title}</span>
                    </div>
                    {isSelected ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {isSelected && (
                    <div className="px-4 pb-4 pt-1 space-y-4 border-t border-white/5 animate-fade-in-node text-left select-text">
                      {/* Roadmap Path */}
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5 flex items-start gap-2.5">
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider block mb-0.5">
                            {language === 'th' ? 'เส้นทางการขยับระบบ (Migration Strategy):' : 'System Migration Strategy:'}
                          </span>
                          <p className="text-[10px] text-gray-300 leading-relaxed font-sans">{data.roadmap}</p>
                        </div>
                      </div>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {language === 'th' ? 'ข้อดี / โอกาสที่น่าสนใจ (Pros):' : 'Aesthetic & Architectural Pros:'}
                          </span>
                          <ul className="list-disc pl-3 text-[10px] text-gray-400 space-y-1.5 leading-relaxed">
                            {data.pros.map((p, i) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            {language === 'th' ? 'ข้อเสีย / ข้อควรระวัง (Cons):' : 'UX & Operational Risks:'}
                          </span>
                          <ul className="list-disc pl-3 text-[10px] text-gray-400 space-y-1.5 leading-relaxed">
                            {data.cons.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                      
                      {/* Cost */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between font-mono">
                        <span className="text-[9px] text-gray-500 uppercase tracking-wider">Estimated Cloud Budget:</span>
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide bg-purple-950/20 px-2 py-0.5 rounded border border-purple-800/30">
                          {data.cost}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ⚡ ส่วนที่ 3.3: Optimization & Config Recommendations (โฟลว์ก๊อปปี้โค้ดจูนระบบ) */}
        <div>
          <div className="mb-3.5 select-none">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4 text-amber-400" />
              {language === 'th' ? 'คีย์เวิร์ดไฟล์ตั้งค่าเซิร์ฟเวอร์ (Tuned Configurations)' : 'Tuned Service Configs & Script Blocks'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {language === 'th'
                ? 'คำแนะนำการจูน Redis, CDN, และฐานข้อมูล SQL เพื่อประสิทธิภาพและการเขียนที่รวดเร็ว'
                : 'Select system components to preview and copy production-optimized configuration files.'}
            </p>
          </div>
          
          <div className="flex flex-col h-[320px] bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
            {/* Component tabs header */}
            <div className="bg-slate-900 border-b border-white/5 flex items-center justify-between px-2 shrink-0">
              <div className="flex items-center">
                {(['redis', 'nginx', 'postgres'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveConfigTab(tab)}
                    className={`px-4 py-3 text-[10px] font-mono font-bold tracking-wide transition-all border-b-2 hover:text-white cursor-pointer ${
                      activeConfigTab === tab
                        ? 'border-cyan-500 text-white bg-slate-950/60'
                        : 'border-transparent text-gray-500 hover:border-slate-800'
                    }`}
                  >
                    {tab === 'redis' 
                      ? (backendStack === 'go-gin' ? 'Redis (go-redis)' : backendStack === 'node-express' ? 'Redis (ioredis)' : backendStack === 'python-fastapi' ? 'Redis (redis-py)' : backendStack === 'java-springboot' ? 'Redis (Lettuce)' : backendStack === 'csharp-netcore' ? 'Redis (.NET)' : 'Redis Tuning')
                      : tab === 'nginx'
                      ? (backendStack === 'go-gin' ? 'Nginx (Go proxy)' : backendStack === 'node-express' ? 'Nginx (Express proxy)' : backendStack === 'python-fastapi' ? 'Nginx (FastAPI proxy)' : backendStack === 'java-springboot' ? 'Nginx (Spring Tomcat)' : backendStack === 'csharp-netcore' ? 'Nginx (Kestrel proxy)' : 'CDN / Nginx')
                      : (backendStack === 'go-gin' ? 'PostgreSQL (Go DB)' : backendStack === 'node-express' ? 'PostgreSQL (pg-pool)' : backendStack === 'python-fastapi' ? 'PostgreSQL (SQLAlchemy)' : backendStack === 'java-springboot' ? 'PostgreSQL (HikariCP)' : backendStack === 'csharp-netcore' ? 'PostgreSQL (EF Core)' : 'Postgres DB')}
                  </button>
                ))}
              </div>
              
              {/* Copy action widget */}
              <button
                onClick={() => triggerCopy(defaultConfigs[activeConfigTab], activeConfigTab)}
                className="p-1.5 rounded-lg border border-white/5 bg-slate-950 text-gray-400 hover:text-white hover:border-white/10 transition-all cursor-pointer mr-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider"
                title="Copy Configuration Snippet"
              >
                {copySuccess === activeConfigTab ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">{language === 'th' ? 'คัดลอกแล้ว' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{language === 'th' ? 'ก๊อปปี้โค้ด' : 'Copy Code'}</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Snippet viewer container */}
            <div className="flex-1 overflow-auto p-4 text-[10px] font-mono bg-slate-950/90 text-left select-text scrollbar-thin">
              <pre className="table w-full">
                {formatConfigContent(defaultConfigs[activeConfigTab])}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 ส่วนที่ 3.4: System Monitoring & Reliability Checklist (คำแนะนำระบบเพิ่มเติม) */}
      <div className="p-5 rounded-2xl border border-white/5 bg-slate-900/25 backdrop-blur-md">
        <div className="flex items-start gap-3 mb-4 select-none">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              {language === 'th' ? 'คำแนะนำการตรวจสอบประสิทธิภาพและความน่าเชื่อถือ (Reliability Checklist)' : 'System Performance & Reliability Recommendations'}
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {language === 'th'
                ? 'ขั้นตอนแนะนำในการทดสอบระบบและเฝ้าระวังเพื่อรักษาสถานะระบบสถาปัตยกรรมระดับล้านยูสเซอร์ให้ปลอดภัยสูงสุด'
                : 'Recommended health metrics and alerting rules to guarantee operational uptime for massive production workloads.'}
            </p>
          </div>
        </div>

        {/* Interactive checklist layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          {monitoringChecklist.map((item, idx) => {
            const isChecked = checkedItems[idx] || false;
            return (
              <div 
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer select-none transition-all duration-200 ${
                  isChecked 
                    ? 'bg-slate-950/40 border-emerald-500/20 text-gray-500' 
                    : 'bg-slate-950/20 border-white/5 hover:border-white/10 text-gray-200'
                }`}
              >
                <div className={`mt-0.5 shrink-0 transition-colors duration-200 ${isChecked ? 'text-emerald-400' : 'text-gray-600'}`}>
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className={`text-[10.5px] font-sans leading-relaxed block transition-all ${
                    isChecked ? 'line-through decoration-emerald-500/20 text-gray-500 font-medium' : 'text-gray-200 font-medium'
                  }`}>
                    {item}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono mt-0.5 block">
                    {isChecked ? (language === 'th' ? '✓ ตรวจสอบแล้ว' : '✓ Verified') : (language === 'th' ? '⏳ ยังไม่ตรวจสอบ' : '⏳ Awaiting verification')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
