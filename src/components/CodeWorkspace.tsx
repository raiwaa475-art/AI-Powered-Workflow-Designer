import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Download, Terminal, Activity } from 'lucide-react';
import JSZip from 'jszip';

// Instant DevOps IaC Skeleton Code Generator based on Workflow layers
const generateSkeleton = (blueprint: any, techStack: string, language: 'th' | 'en') => {
  const files: Record<string, string> = {};
  if (!blueprint) return { explanation: '', files };

  const title = blueprint.title || 'Microservice Architecture';
  const desc = blueprint.description || 'High-performance containerized system';
  const layers = blueprint.layers || [];
  
  // Build docker-compose and configurations based on layers
  let servicesYaml = '';
  let nginxUpstreams = '';
  let nginxRoutes = '';
  let k8sManifests = '';
  let tfResources = '';

  layers.forEach((layer: any) => {
    const layerId = layer.id;
    const nodes = layer.nodes || [];
    
    nodes.forEach((node: any) => {
      if (!node || !node.id) return;
      const cleanId = node.id.replace(/[^\w-]/g, '');
      const type = node.type || 'Service';
      
      if (layerId === 'presentation') {
        servicesYaml += `  ${cleanId}:
    image: nginx:alpine
    container_name: ${cleanId}
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    restart: always
    networks:
      - web-net
      - app-net
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 10s\n\n`;

        k8sManifests += `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanId}
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: nginx:alpine
        ports:
        - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: ${cleanId}
---\n`;

        tfResources += `resource "aws_instance" "${cleanId.replace(/-/g, '_')}" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.medium"
  tags = {
    Name = "${cleanId}"
    Layer = "Presentation"
  }
}\n\n`;

      } else if (layerId === 'application') {
        servicesYaml += `  ${cleanId}:
    image: node:18-alpine
    container_name: ${cleanId}
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis-cache:6379
      - DB_URL=postgresql://postgres-db:5432/ticketing
    restart: on-failure
    networks:
      - app-net
      - queue-net
      - data-net
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1"]
      interval: 15s\n\n`;
        
        nginxUpstreams += `upstream ${cleanId}_servers {\n  server ${cleanId}:8080;\n}\n\n`;
        nginxRoutes += `  location /api/${cleanId.replace('-service', '')} {\n    proxy_pass http://${cleanId}_servers;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n  }\n\n`;

        k8sManifests += `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanId}
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: node:18-alpine
        ports:
        - containerPort: 8080
        env:
        - name: DB_URL
          value: "postgresql://postgres-db:5432/ticketing"
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  ports:
  - port: 8080
    targetPort: 8080
  selector:
    app: ${cleanId}
---\n`;

        tfResources += `resource "aws_instance" "${cleanId.replace(/-/g, '_')}" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.large"
  tags = {
    Name = "${cleanId}"
    Layer = "Application"
  }
}\n\n`;

      } else if (layerId === 'queue') {
        const isKafka = cleanId.toLowerCase().includes('kafka');
        if (isKafka) {
          servicesYaml += `  zookeeper:
    image: confluentinc/cp-zookeeper:7.3.0
    container_name: zookeeper
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181
    networks:
      - queue-net

  ${cleanId}:
    image: confluentinc/cp-kafka:7.3.0
    container_name: ${cleanId}
    depends_on:
      - zookeeper
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://${cleanId}:9092,PLAINTEXT_HOST://localhost:29092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    restart: always
    networks:
      - queue-net\n\n`;
        } else {
          servicesYaml += `  ${cleanId}:
    image: rabbitmq:3-management-alpine
    container_name: ${cleanId}
    ports:
      - "5672:5672"
      - "15672:15672"
    restart: always
    networks:
      - queue-net\n\n`;
        }

        k8sManifests += `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${cleanId}
  namespace: default
spec:
  serviceName: "${cleanId}"
  replicas: 1
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: rabbitmq:3-management-alpine
        ports:
        - containerPort: 5672
          name: amqp
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  ports:
  - port: 5672
    targetPort: 5672
  selector:
    app: ${cleanId}
---\n`;

        tfResources += `resource "aws_mq_broker" "${cleanId.replace(/-/g, '_')}" {
  broker_name        = "${cleanId}"
  engine_type        = "RabbitMQ"
  engine_version     = "3.8.22"
  host_instance_type = "mq.t3.micro"
  publicly_accessible = false
  user {
    username = "admin"
    password = "secret_broker_password"
  }
}\n\n`;

      } else if (layerId === 'data') {
        const isRedis = cleanId.toLowerCase().includes('redis');
        const isPostgres = cleanId.toLowerCase().includes('postgres') || cleanId.toLowerCase().includes('db');
        
        if (isRedis) {
          servicesYaml += `  ${cleanId}:
    image: redis:7-alpine
    container_name: ${cleanId}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: always
    networks:
      - data-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s\n\n`;

          k8sManifests += `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${cleanId}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  ports:
  - port: 6379
  selector:
    app: ${cleanId}
---\n`;

          tfResources += `resource "aws_elasticache_cluster" "${cleanId.replace(/-/g, '_')}" {
  cluster_id           = "${cleanId}"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  port                 = 6379
}\n\n`;

        } else if (isPostgres) {
          servicesYaml += `  ${cleanId}:
    image: postgres:15-alpine
    container_name: ${cleanId}
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret_db_pass
      - POSTGRES_DB=ticketing
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    restart: always
    networks:
      - data-net
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d ticketing"]
      interval: 10s\n\n`;

          k8sManifests += `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${cleanId}
spec:
  serviceName: "${cleanId}"
  replicas: 1
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: ticketing
        ports:
        - containerPort: 5432
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  ports:
  - port: 5432
  selector:
    app: ${cleanId}
---\n`;

          tfResources += `resource "aws_db_instance" "${cleanId.replace(/-/g, '_')}" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = "db.t3.micro"
  db_name              = "ticketing"
  username             = "admin"
  password             = "secret_db_pass"
  skip_final_snapshot  = true
}\n\n`;

        } else {
          servicesYaml += `  ${cleanId}:
    image: mongo:6-jammy
    container_name: ${cleanId}
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    restart: always
    networks:
      - data-net\n\n`;

          k8sManifests += `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: ${cleanId}
spec:
  serviceName: "${cleanId}"
  replicas: 1
  selector:
    matchLabels:
      app: ${cleanId}
  template:
    metadata:
      labels:
        app: ${cleanId}
    spec:
      containers:
      - name: ${cleanId}
        image: mongo:6-jammy
        ports:
        - containerPort: 27017
---
apiVersion: v1
kind: Service
metadata:
  name: ${cleanId}
spec:
  ports:
  - port: 27017
  selector:
    app: ${cleanId}
---\n`;
        }
      }
    });
  });

  const readmeContent = language === 'th'
    ? `# 🚀 คู่มือการติดตั้งสถาปัตยกรรมระดับโปรดักชัน: ${title}

ระบบนี้ได้รับการจำลองและเตรียมพร้อมสำหรับการสตรีมข้อมูลความหน่วงต่ำ (End-to-End Workflow):
- **สเปกดีไซน์**: ${desc}
- **สถาปัตยกรรมหลัก**: Multi-Agent 4-Tier Node Clustering

## 🛠️ วิธีการ Spin up สภาพแวดล้อม Local (Quickstart)

1. ตรวจสอบความถูกต้องของ docker-compose.yml และไฟล์คอนฟิกต่างๆ
2. รันคำสั่ง Docker Compose เพื่อสร้างคลัสเตอร์ในแบ็กกราวด์:
   \`\`\`bash
   docker compose up -d
   \`\`\`
3. ตรวจสอบการผ่านสเตจ Healthcheck ของเวิร์กโฟลว์ข้อมูล:
   \`\`\`bash
   docker compose ps
   \`\`\`
4. เริ่มจับพฤติกรรมการเชื่อมต่อและวิเคราะห์คอขวด:
   \`\`\`bash
   docker compose logs -f
   \`\`\`

---
*หมายเหตุ: นี่คือไฟล์ร่างคอนฟิกเบื้องต้น (IaC Draft Skeleton) คุณสามารถกดปุ่ม "⚡ เจนเนอเรตโค้ดเต็มด้วย AI" ด้านบนเพื่อเรียก DevOps Agent และสังเคราะห์คอนฟิกระดับสูงฉบับพร้อมใช้งานจริงในโปรดักชันทันที!*`
    : `# 🚀 Production DevOps & Infrastructure Setup: ${title}

High-performance orchestrations derived from your system model layers:
- **Architecture Goal**: ${desc}
- **Clustering Paradigm**: Multi-Agent 4-Tier Topology

## 🛠️ Spin up Cluster Locally (Quickstart)

1. Confirm that docker-compose.yml is properly configured on your machine.
2. Initialize and deploy all components in the background:
   \`\`\`bash
   docker compose up -d
   \`\`\`
3. Monitor status metrics and dependency healthchecks:
   \`\`\`bash
   docker compose ps
   \`\`\`
4. Capture telemetry insights and route debug logs:
   \`\`\`bash
   docker compose logs -f
   \`\`\`

---
*Note: This is an automatically generated draft layout. Click "⚡ Generate Full Code (AI)" above to execute full principal pipeline tuning and print advanced config outputs.*`;

  if (techStack === 'docker-compose') {
    files['docker-compose.yml'] = `version: '3.8'

services:
${servicesYaml || `  web-gateway:
    image: nginx:alpine
    ports:
      - "80:80"
    networks:
      - web-net`}

volumes:
  pg_data:
  redis_data:
  mongo_data:

networks:
  web-net:
    driver: bridge
  app-net:
    driver: bridge
  queue-net:
    driver: bridge
  data-net:
    driver: bridge
`;

    files['nginx.conf'] = `worker_processes auto;

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  sendfile on;
  keepalive_timeout 65;

  # Upstream Clusters for dynamic routing
${nginxUpstreams || `  upstream application_servers {\n    server auth-service:8080;\n  }\n`}
  server {
    listen 80;
    server_name localhost;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Backend API proxies
${nginxRoutes || `    location /api {\n      proxy_pass http://application_servers;\n      proxy_set_header Host $host;\n    }\n`}
    # Default visual static web page response
    location / {
      root /usr/share/nginx/html;
      index index.html index.htm;
      try_files $uri $uri/ /index.html;
    }
  }
}
`;

    files['src/README.md'] = readmeContent;

  } else if (techStack === 'kubernetes') {
    files['k8s/manifests.yaml'] = k8sManifests || `# Sample Kubernetes Resources\n`;
    files['src/README.md'] = readmeContent;
  } else if (techStack === 'terraform') {
    files['terraform/main.tf'] = `provider "aws" {
  region = "ap-southeast-1"
}

# Dynamic VPC Networks
resource "aws_vpc" "system_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = {
    Name = "${title.toLowerCase().replace(/\s+/g, '-')}-vpc"
  }
}

# Virtual Node Clusters
${tfResources || `# Default compute shapes`}
`;
    files['src/README.md'] = readmeContent;
  }

  return {
    explanation: language === 'th'
      ? 'นี่คือไฟล์โครงสร้างพื้นฐานระดับ DevOps (IaC Draft Skeleton) คุณสามารถคลิกปุ่ม "⚡ เจนเนอเรตโค้ดเต็มด้วย AI" เพื่อเรียก Agent ในการคำนวณและเขียนไฟล์สเปค Docker Compose Cluster, คอนฟิกการทำ Nginx Upstream Load Balancing และคู่มือฉบับเต็มโดยละเอียด!'
      : 'This is a preliminary Infrastructure-as-Code config suite (Draft Skeleton). Click "⚡ Generate Full Code (AI)" in the toolbar to invoke our DevOps pipeline and compile complete customized docker networks, Nginx balancing clusters, and setup checklists.',
    files
  };
};

interface CodeWorkspaceProps {
  blueprint: any;
  techStack: string;
  onStackChange: (stack: string) => void;
  language: 'th' | 'en';
  addTokens?: (prompt: number, completion: number) => void;
  
  // Lifted States & Props
  codeData: { explanation: string; files: Record<string, string> } | null;
  setCodeData: React.Dispatch<React.SetStateAction<{ explanation: string; files: Record<string, string> } | null>>;
  isAiGenerated: boolean;
  setIsAiGenerated: React.Dispatch<React.SetStateAction<boolean>>;
  isGenerating: boolean;
  triggerFullAiGeneration: () => Promise<void>;
  selectedFile: string;
  setSelectedFile: React.Dispatch<React.SetStateAction<string>>;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({
  blueprint,
  techStack,
  onStackChange,
  language,
  addTokens,
  codeData,
  setCodeData,
  isAiGenerated,
  setIsAiGenerated,
  isGenerating,
  triggerFullAiGeneration,
  selectedFile,
  setSelectedFile
}) => {
  const [copied, setCopied] = useState(false);

  // Instantly generate structural skeleton locally on mount or stack changes
  useEffect(() => {
    if (!blueprint) return;
    
    // Prevent overwriting full AI-generated code on mount if it's already there
    if (isAiGenerated && codeData) return;

    // Prevent overwriting when currently generating full code via AI in the background
    if (isGenerating) return;
    
    // Auto-adjust default tech stack on mount if old values present
    let currentStack = techStack;
    if (!['docker-compose', 'kubernetes', 'terraform'].includes(techStack)) {
      currentStack = 'docker-compose';
      onStackChange('docker-compose');
    }

    const skeleton = generateSkeleton(blueprint, currentStack, language);
    setCodeData(skeleton);
    setIsAiGenerated(false);
    
    // Autofocus appropriate main file
    if (currentStack === 'docker-compose') {
      setSelectedFile('docker-compose.yml');
    } else if (currentStack === 'kubernetes') {
      setSelectedFile('k8s/manifests.yaml');
    } else if (currentStack === 'terraform') {
      setSelectedFile('terraform/main.tf');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blueprint, techStack, isGenerating]);

  const copyToClipboard = () => {
    if (!codeData || !codeData.files[selectedFile]) return;
    navigator.clipboard.writeText(codeData.files[selectedFile]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadZip = async () => {
    if (!codeData) return;
    
    const zip = new JSZip();
    
    // Add all files to Zip archive
    for (const [filepath, content] of Object.entries(codeData.files)) {
      zip.file(filepath, content);
    }
    
    // Generate Zip
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${blueprint.title?.toLowerCase().replace(/\s+/g, '-') || 'system-orchestration'}-export.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!blueprint) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-950/20 rounded-2xl border border-white/5 p-8">
        <div className="w-10 h-10 bg-slate-900 border border-white/5 rounded-xl flex items-center justify-center text-cyan-400">
          <Terminal className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">
            {language === 'th' ? 'กำลังรอการจัดพิมพ์แผนผังเวิร์กโฟลว์...' : 'Awaiting system architecture design...'}
          </p>
          <p className="text-xs text-gray-500 max-w-sm mt-1 leading-relaxed">
            {language === 'th' 
              ? 'กรุณาสร้างหรือนำเข้าโครงร่างการดีไซน์ระบบจากแถบด้านบน เพื่อประมวลผลโค้ดคอนฟิก Docker Compose Clusters หรือ Kubernetes YAML Manifests ในหน้านี้!'
              : 'Generate or customize a system canvas layout first. Dynamic infrastructure parameters, yaml brokers, and gateway maps will compile automatically here.'}
          </p>
        </div>
      </div>
    );
  }

  // Basic custom syntax styling for custom look
  const formatCodeViewer = (code: string, filepath: string) => {
    if (!code) return null;
    
    const ext = filepath.split('.').pop() || '';
    
    return code.split('\n').map((line, idx) => {
      let lineClass = 'text-gray-300';
      const trimmed = line.trim();
      
      if (trimmed.startsWith('#') || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        lineClass = 'text-emerald-500 font-mono';
      } else if (ext === 'yml' || ext === 'yaml') {
        if (trimmed.endsWith(':')) lineClass = 'text-cyan-400 font-bold';
        else if (trimmed.startsWith('-')) lineClass = 'text-indigo-400 font-semibold';
        else if (trimmed.includes(': ')) lineClass = 'text-slate-400';
      } else if (ext === 'tf') {
        if (trimmed.startsWith('resource') || trimmed.startsWith('provider') || trimmed.startsWith('variable') || trimmed.startsWith('output')) {
          lineClass = 'text-cyan-400 font-bold';
        } else if (trimmed.includes('=')) {
          lineClass = 'text-amber-300';
        }
      } else if (ext === 'conf') {
        if (trimmed.endsWith('{') || trimmed.endsWith('}')) lineClass = 'text-cyan-400 font-bold';
        else if (trimmed.includes(' ')) lineClass = 'text-slate-400';
      }
      
      return (
        <div key={idx} className="table-row">
          <span className="table-cell select-none text-right pr-4 text-slate-600 text-[10px] w-8 font-mono">{idx + 1}</span>
          <span className={`table-cell whitespace-pre ${lineClass}`}>{line}</span>
        </div>
      );
    });
  };

  const filesList = codeData ? Object.keys(codeData.files) : [];
  
  return (
    <div className="space-y-4 animate-fade-in-node">
      {/* Top controls: Selector & downloader & manual AI generator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/40 p-4 border border-white/5 rounded-2xl">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {language === 'th' ? 'เลือกรูปแบบการติดตั้ง (IaC):' : 'Deployment Orchestrations:'}
            </span>
            <select
              value={techStack}
              onChange={(e) => onStackChange(e.target.value)}
              disabled={isGenerating}
              className="bg-slate-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-semibold cursor-pointer outline-none focus:border-cyan-500/50"
            >
              <option value="docker-compose">Docker Compose YAML</option>
              <option value="kubernetes">Kubernetes (K8s) Manifests</option>
              <option value="terraform">HashiCorp Terraform HCL</option>
            </select>
          </div>

          {!isAiGenerated && (
            <button
              onClick={triggerFullAiGeneration}
              disabled={isGenerating}
              className="py-1.5 px-3.5 rounded-xl border border-purple-500/30 bg-purple-600/10 text-purple-400 hover:bg-purple-600/20 disabled:opacity-40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-purple-500/5 hover:-translate-y-0.5"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>{language === 'th' ? '⚡ เจนเนอเรตโค้ดเต็มด้วย AI' : '⚡ Generate Full Code (AI)'}</span>
            </button>
          )}
        </div>
        
        {codeData && (
          <button
            onClick={downloadZip}
            className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-cyan-900/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {language === 'th' ? 'ดาวน์โหลดโปรเจกต์ ZIP' : 'Download Project ZIP'}
          </button>
        )}
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-950/20 rounded-2xl border border-white/5">
          <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
          <span className="text-xs text-gray-400 font-mono">
            {language === 'th' ? 'AI DevOps Agent กำลังคำนวณและเขียนไฟล์สเปคคอนฟิกระดับสูง...' : 'Orchestrating container networks, loadbalancers and volumes...'}
          </span>
        </div>
      ) : codeData ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[500px]">
          {/* File Tree Explorer (Left Side) */}
          <div className="md:col-span-1 bg-slate-950 border border-white/5 rounded-2xl p-4 overflow-y-auto text-left scrollbar-thin">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold"><FileCode className="w-3.5 h-3.5 text-cyan-400" />IaC Workspace</span>
              {!isAiGenerated && (
                <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider animate-pulse">
                  {language === 'th' ? 'แบบร่าง' : 'DRAFT'}
                </span>
              )}
            </span>
            
            <div className="space-y-1 text-xs font-mono select-none">
              {filesList.map(filepath => {
                const parts = filepath.split('/');
                const filename = parts[parts.length - 1];
                const folderName = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
                const isSelected = selectedFile === filepath;
                
                return (
                  <button
                    key={filepath}
                    onClick={() => setSelectedFile(filepath)}
                    className={`flex items-center justify-between py-1.5 px-2.5 w-full text-left rounded-xl transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-cyan-600/15 text-cyan-400 font-bold border border-cyan-500/20' 
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className="truncate">{filename}</span>
                    </div>
                    {folderName && (
                      <span className="text-[8px] opacity-40 font-semibold uppercase tracking-wider px-1.5 py-0.5 bg-slate-900 border border-white/5 rounded">
                        {folderName}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Custom Styled Code Viewer (Right Side) */}
          <div className="md:col-span-3 flex flex-col bg-slate-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative h-full">
            {/* Top Bar inside Code Viewer */}
            <div className="bg-slate-900/60 border-b border-white/5 flex items-center justify-between px-4 py-2 select-none">
              <span className="text-[10px] font-mono text-cyan-400 font-bold bg-slate-950 px-2.5 py-1 rounded border border-white/5 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>{selectedFile}</span>
              </span>
              
              <button
                onClick={copyToClipboard}
                className="py-1 px-3 rounded-lg border border-white/5 bg-slate-950 hover:bg-slate-900 text-gray-300 hover:text-white font-medium text-[10px] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                {copied ? (language === 'th' ? 'คัดลอกแล้ว!' : 'Copied!') : (language === 'th' ? 'คัดลอกโค้ด' : 'Copy')}
              </button>
            </div>
            
            {/* Editor Area */}
            <div className="flex-1 overflow-auto p-4 text-[11px] font-mono bg-slate-950/80 text-left select-text scrollbar-thin h-full">
              <pre className="table w-full">
                {formatCodeViewer(codeData.files[selectedFile], selectedFile)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
