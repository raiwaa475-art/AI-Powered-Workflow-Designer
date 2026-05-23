import { NextRequest } from 'next/server';

export interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface WorkflowLayer {
  id: 'presentation' | 'application' | 'queue' | 'data';
  name: string;
  nodes: WorkflowNode[];
}

export interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  description: string;
  involved_nodes: string[];
}

export interface WorkflowData {
  title: string;
  description: string;
  layers: WorkflowLayer[];
  steps: WorkflowStep[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Aesthetic Bilingual Mock Architectures Presets
───────────────────────────────────────────────────────────────────────────── */

const PRESETS = {
  concert: {
    en: {
      title: "1M Users Concert Ticket Ingestion Engine",
      description: "Production-grade microservices and workflow system architecture designed for ultra-high concurrency during booking spikes. Uses Cloudflare CDN for fast static caching, a high-speed Go-based Session service, Kafka for message buffering, and Redis for distributed seat locks to enforce strict ACID compliance and zero double-selling.",
      layers: [
        {
          id: "presentation" as const,
          name: "Client Gateways",
          nodes: [
            { id: "cdn-cloudflare", name: "Cloudflare CDN", type: "CDN", description: "Absorbs initial DNS requests, filters DDoS attacks, and caches static seats map assets." },
            { id: "nginx-ingress", name: "Nginx Ingress Proxy", type: "API Gateway", description: "Balances incoming user sessions and routes HTTP/REST endpoints dynamically." }
          ]
        },
        {
          id: "application" as const,
          name: "Business Microservices",
          nodes: [
            { id: "auth-service", name: "Go Session Service", type: "Microservice", description: "Validates user JWT tokens and rate-limits active requests at the entry point." },
            { id: "booking-service", name: "Ticketing Microservice", type: "Microservice", description: "Processes ticket reservations, maps selected seats, and queues payment orders." }
          ]
        },
        {
          id: "queue" as const,
          name: "Ingestion Queues",
          nodes: [
            { id: "kafka-ingest", name: "Kafka Broker Cluster", type: "Message Broker", description: "Buffers booking orders as append-only logs, protecting the write DB from overload." }
          ]
        },
        {
          id: "data" as const,
          name: "Databases & Caching",
          nodes: [
            { id: "redis-cache", name: "Redis Distributed Cache", type: "Cache", description: "Stores live seating maps and expires seat locks after 10 minutes." },
            { id: "postgres-db", name: "PostgreSQL Primary Database", type: "Relational DB", description: "The ultimate ledger for confirmed orders, supporting robust ACID transactions." }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "Load Catalog & Seats", description: "User requests concert page. Request resolved instantly via edge nodes in Cloudflare CDN.", involved_nodes: ["cdn-cloudflare"] },
        { id: "step-2", number: 2, title: "Submit Ticket Reservation", description: "User submits selected seats. Nginx Ingress routes request to Ticketing Microservice.", involved_nodes: ["nginx-ingress", "booking-service"] },
        { id: "step-3", number: 3, title: "Deduct Seat Lock in Cache", description: "Ticketing Microservice requests temporary seat lock in Redis to prevent double booking.", involved_nodes: ["booking-service", "redis-cache"] },
        { id: "step-4", number: 4, title: "Queue Order Payload", description: "Once locked in cache, Ticketing service publishes order event directly to Kafka Broker.", involved_nodes: ["booking-service", "kafka-ingest"] },
        { id: "step-5", number: 5, title: "Write Transaction to DB", description: "Postgres Consumer pulls orders from Kafka sequentially and writes permanent transaction records.", involved_nodes: ["kafka-ingest", "postgres-db"] }
      ]
    },
    th: {
      title: "ระบบกดบัตรคอนเสิร์ต 1M Users Engine",
      description: "สถาปัตยกรรมระดับโปรดักชันที่ออกแบบมาเพื่อรองรับทราฟฟิกมหาศาลในช่วงเวลาที่เปิดขายบัตรคอนเสิร์ต ใช้ระบบแคชของ Cloudflare CDN, บริการจัดเก็บเซสชันประสิทธิภาพสูงในภาษา Go, ท่อคิวอิมเมจของ Kafka เพื่อกรองโหลดการเขียน, และ Redis สำหรับการทำ Seat Locks แบบกระจายเพื่อรับประกันความถูกต้อง 100% ป้องกันการซื้อซ้ำซ้อน",
      layers: [
        {
          id: "presentation" as const,
          name: "เกตเวย์รับส่งข้อมูล (Client Gateways)",
          nodes: [
            { id: "cdn-cloudflare", name: "Cloudflare CDN", type: "CDN", description: "รับคำขอด้านเครือข่าย ป้องกันการโจมตีแบบ DDoS และเก็บแคชไฟล์แผนผังที่นั่งคงที่ที่ขอบเครือข่าย" },
            { id: "nginx-ingress", name: "Nginx Ingress Proxy", type: "API Gateway", description: "กระจายโหลดของผู้ใช้งานและกำหนดเส้นทางการส่งข้อมูล (HTTP/REST) ไปยังไมโครเซอร์วิส" }
          ]
        },
        {
          id: "application" as const,
          name: "บริการประมวลผล (Core Microservices)",
          nodes: [
            { id: "auth-service", name: "Go Session Service", type: "Microservice", description: "ตรวจสอบความถูกต้องของสิทธิ์การใช้งาน (JWT) และจำกัดอัตราการยิงข้อมูลของผู้ใช้ที่ปากทางเข้า" },
            { id: "booking-service", name: "Ticketing Microservice", type: "Microservice", description: "ประมวลผลการจองบัตร จับคู่หมายเลขที่นั่ง และเตรียมส่งรายการคำสั่งซื้อไปยังระบบชำระเงิน" }
          ]
        },
        {
          id: "queue" as const,
          name: "คิวงานระบบหลังบ้าน (Ingestion Queues)",
          nodes: [
            { id: "kafka-ingest", name: "Kafka Broker Cluster", type: "Message Broker", description: "บัฟเฟอร์คำสั่งซื้อเก็บในรูปแบบ Log ต่อเนื่อง เพื่อความปลอดภัยและถนอมฐานข้อมูลหลักไม่ให้พัง" }
          ]
        },
        {
          id: "data" as const,
          name: "ฐานข้อมูลหลัก (Databases & Cache)",
          nodes: [
            { id: "redis-cache", name: "Redis Distributed Cache", type: "Cache", description: "เก็บข้อมูลแผนผังผังที่นั่งที่ยังมีอยู่จริง และควบคุมการล็อกที่นั่งชั่วคราวที่มีอายุกำหนด 10 นาที" },
            { id: "postgres-db", name: "PostgreSQL DB Primary", type: "Relational DB", description: "ระบบบันทึกรายการคำสั่งซื้อหลักที่มีความปลอดภัย มีคุณสมบัติ ACID ครบถ้วน บันทึกถาวรลงดีสก์" }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "โหลดรายละเอียดที่นั่ง", description: "ผู้ใช้เปิดหน้าเว็บระบบขายตั๋ว รายการข้อมูลคงที่ทั้งหมดจะถูกตอบสนองอย่างรวดเร็วจากเครื่องแม่ข่าย Cloudflare CDN", involved_nodes: ["cdn-cloudflare"] },
        { id: "step-2", number: 2, title: "ส่งข้อมูลจองตั๋วเข้าระบบ", description: "ผู้ใช้เลือกที่นั่งและส่งคำร้องขอ ระบบจะวิ่งผ่าน Nginx Ingress เข้าสู่ Ticketing Microservice", involved_nodes: ["nginx-ingress", "booking-service"] },
        { id: "step-3", number: 3, title: "ทำจองล็อกที่นั่งบนแคช", description: "Ticketing Microservice ส่งคำสั่งไปจองล็อกที่นั่งชั่วคราวใน Redis ป้องกันไม่ให้ผู้อื่นทำจองซ้ำได้", involved_nodes: ["booking-service", "redis-cache"] },
        { id: "step-4", number: 4, title: "ผลักคำสั่งซื้อเข้าคิวบอร์ด", description: "หลังจากล็อกที่นั่งในแคชเรียบร้อย เซอร์วิสจะเผยแพร่เหตุการณ์คำสั่งซื้อเข้าสู่ Kafka ทันทีเพื่อความลื่นไหล", involved_nodes: ["booking-service", "kafka-ingest"] },
        { id: "step-5", number: 5, title: "บันทึกข้อมูลจองลงฐานข้อมูล", description: "ระบบฝั่งเขียน (Consumer) ดึงออเดอร์ออกจาก Kafka ตามลำดับ และเขียนธุรกรรมบันทึกลงฐานข้อมูล PostgreSQL", involved_nodes: ["kafka-ingest", "postgres-db"] }
      ]
    }
  },
  chat: {
    en: {
      title: "Real-time Messaging & Chat Core Engine",
      description: "A highly resilient, sub-second latency messaging engine tailored for instant communications. Utilizes persistent WebSockets, RabbitMQ for immediate message routing, and Redis clusters to manage live session presences and active server routing tables.",
      layers: [
        {
          id: "presentation" as const,
          name: "Network Gateways",
          nodes: [
            { id: "dns-route53", name: "AWS Route 53", type: "CDN", description: "Resolves domain requests and handles global geo-routing." },
            { id: "websocket-gateway", name: "WebSocket Gateway Node", type: "API Gateway", description: "Terminates secure WSS connections and maintains persistent bi-directional duplex channels." }
          ]
        },
        {
          id: "application" as const,
          name: "Processing Services",
          nodes: [
            { id: "chat-service", name: "Real-time Chat Microservice", type: "Microservice", description: "Orchestrates direct/group chats, parses payloads, and manages channel metadata." },
            { id: "user-service", name: "User Status Service", type: "Microservice", description: "Tracks active profile updates and authenticates websocket authorization tickets." }
          ]
        },
        {
          id: "queue" as const,
          name: "Message Distribution",
          nodes: [
            { id: "rabbitmq-broker", name: "RabbitMQ Event Hub", type: "Message Broker", description: "Routes private/group chat messages to exact targeted gateway nodes immediately." }
          ]
        },
        {
          id: "data" as const,
          name: "Storage & Cache Tiers",
          nodes: [
            { id: "redis-presence", name: "Redis Presence Cache", type: "Cache", description: "Keeps lightweight records of active client IDs and their corresponding connected socket servers." },
            { id: "mongodb-messages", name: "MongoDB Archive Cluster", type: "NoSQL DB", description: "High-throughput document store for archiving historical chat logs and messages." }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "WebSocket Connection handshake", description: "Client initializes connection, resolved by Route 53 and established on WS gateway.", involved_nodes: ["dns-route53", "websocket-gateway"] },
        { id: "step-2", number: 2, title: "Presence Registration & Status Check", description: "WebSocket Gateway registers client's online state and maps routing path inside Redis Presence Cache.", involved_nodes: ["websocket-gateway", "redis-presence"] },
        { id: "step-3", number: 3, title: "Transmit Message Payload", description: "User sends message. WebSocket routes it into Chat Microservice which checks authorization via User Service.", involved_nodes: ["websocket-gateway", "user-service", "chat-service"] },
        { id: "step-4", number: 4, title: "Publish & Broadcast Exchange", description: "Chat Service publishes message to RabbitMQ which fan-outs data to correct online gateway for instant push.", involved_nodes: ["chat-service", "rabbitmq-broker", "websocket-gateway"] },
        { id: "step-5", number: 5, title: "Archive Chat History", description: "Background workers consume messages from RabbitMQ asynchronously and store them in MongoDB cluster.", involved_nodes: ["rabbitmq-broker", "mongodb-messages"] }
      ]
    },
    th: {
      title: "ระบบส่งข้อความและแชทเรียลไทม์ความเร็วสูง (Real-time Chat Engine)",
      description: "ระบบสถาปัตยกรรมแชทและข้อความแบบเรียลไทม์ ความล่าช้าต่ำระดับมิลลิวินาที รองรับการพูดคุยและส่งสื่อผสมอย่างรวดเร็ว ทำงานบนเครือข่าย WebSocket ถาวร, เชื่อมโยงผ่านคิว RabbitMQ สำหรับกระจายเหตุการณ์ข้อความ, และแคช Redis ในการบันทึกสถานะออนไลน์ (Presence) ของยูสเซอร์พร้อมกันหลายล้านราย",
      layers: [
        {
          id: "presentation" as const,
          name: "เกตเวย์รับส่งข้อมูล (Client Gateways)",
          nodes: [
            { id: "dns-route53", name: "AWS Route 53 DNS", type: "CDN", description: "แปลชื่อโดเมนเป็นไอพีเซิร์ฟเวอร์ และนำทางผู้ใช้งานไปยังศูนย์ข้อมูลที่ใกล้ที่สุดทั่วโลก" },
            { id: "websocket-gateway", name: "WebSocket Gateway Node", type: "API Gateway", description: "เชื่อมต่อคู่ขนานกับไคลเอนต์แบบถาวร (WSS) เพื่อรับส่งข้อมูลแบบสองทิศทางได้ทันที" }
          ]
        },
        {
          id: "application" as const,
          name: "บริการประมวลผล (Core Microservices)",
          nodes: [
            { id: "chat-service", name: "Chat Engine Microservice", type: "Microservice", description: "ดูแลการทำงานแชท ส่งคำขอ จัดการห้องแชทเดี่ยวและกลุ่ม พร้อมกรองคำต้องห้าม" },
            { id: "user-service", name: "User Status Microservice", type: "Microservice", description: "บันทึกประวัติโปรไฟล์ ตรวจสอบสิทธิ์การแชท และสิทธิ์ในการเข้าถึงห้องสนทนาต่าง ๆ" }
          ]
        },
        {
          id: "queue" as const,
          name: "คิวงานระบบหลังบ้าน (Ingestion Queues)",
          nodes: [
            { id: "rabbitmq-broker", name: "RabbitMQ Event Hub", type: "Message Broker", description: "กระจายข้อความแชทส่งต่อไปยังเซิร์ฟเวอร์เกตเวย์ปลายทางที่ผู้ใช้เป้าหมายกำลังเชื่อมต่ออยู่" }
          ]
        },
        {
          id: "data" as const,
          name: "ฐานข้อมูลหลัก (Databases & Cache)",
          nodes: [
            { id: "redis-presence", name: "Redis Online Presence Cache", type: "Cache", description: "เก็บค่าสถานะ ออนไลน์/ออฟไลน์ ของผู้ใช้งาน และจดจำว่าผู้ใช้กำลังรันอยู่บนโหนดเกตเวย์ใด" },
            { id: "mongodb-messages", name: "MongoDB Archive Cluster", type: "NoSQL DB", description: "ฐานข้อมูลจัดเก็บข้อความแชทและประวัติการคุยขนาดใหญ่แบบไม่เป็นโครงสร้าง เขียนเร็วไม่มีสะดุด" }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "เริ่มจับคู่สัญญาณ WebSocket", description: "ไคลเอนต์ทำการเชื่อมต่อ วิ่งผ่าน DNS ของ AWS และสร้างท่อเชื่อมสัญญาณ WSS กับ WebSocket Gateway ถาวร", involved_nodes: ["dns-route53", "websocket-gateway"] },
        { id: "step-2", number: 2, title: "ลงทะเบียนออนไลน์บนระบบ", description: "WebSocket Gateway บันทึกเลขพิกัดของยูสเซอร์ว่าพร้อมออนไลน์และเชื่อมอยู่ที่ใดเก็บไว้ใน Redis", involved_nodes: ["websocket-gateway", "redis-presence"] },
        { id: "step-3", number: 3, title: "ส่งข้อมูลแชทเข้ามา", description: "ผู้ใช้ส่งข้อความแชท วิ่งผ่านท่อเข้ามาหา Chat Microservice เพื่อทำการตรวจสอบสิทธิ์ความปลอดภัยผ่าน User Service", involved_nodes: ["websocket-gateway", "user-service", "chat-service"] },
        { id: "step-4", number: 4, title: "กระจายข้อความแชทเรียลไทม์", description: "เซอร์วิสส่งข้อความเข้า RabbitMQ จากนั้นมันจะดันข้อมูลเข้าสู่เกตเวย์ปลายทางเพื่อผลักขึ้นหน้าจอยูสเซอร์อีกฝั่งทันที", involved_nodes: ["chat-service", "rabbitmq-broker", "websocket-gateway"] },
        { id: "step-5", number: 5, title: "จัดเก็บประวัติสนทนาถาวร", description: "คิวงานเบื้องหลังอ่านข้อความจาก RabbitMQ อย่างเงียบ ๆ และจัดเก็บข้อความลง MongoDB สำหรับเรียกดูประวัติย้อนหลัง", involved_nodes: ["rabbitmq-broker", "mongodb-messages"] }
      ]
    }
  },
  default: {
    en: {
      title: "Enterprise Distributed Microservices Platform",
      description: "A robust, general-purpose enterprise software layout suitable for distributed business logic. Features an API gateway pattern, asynchronous event-driven queues, caching for database read optimization, and secure persistent relational layers.",
      layers: [
        {
          id: "presentation" as const,
          name: "Ingress Layer",
          nodes: [
            { id: "f5-loadbalancer", name: "F5 Load Balancer", type: "CDN", description: "Directs incoming client traffic evenly across edge web server pods." },
            { id: "apigee-gateway", name: "Apigee Ingress Gateway", type: "API Gateway", description: "Validates API keys, enforces access policies, and routes traffic cleanly." }
          ]
        },
        {
          id: "application" as const,
          name: "Core Business Apps",
          nodes: [
            { id: "core-service", name: "Core Application Service", type: "Microservice", description: "Handles primary business execution flow and processes transaction operations." },
            { id: "helper-service", name: "Metadata Auxiliary Service", type: "Microservice", description: "Provides ancillary data and configurations required by core applications." }
          ]
        },
        {
          id: "queue" as const,
          name: "Asynchronous Pipelines",
          nodes: [
            { id: "sqs-transactions", name: "AWS SQS Event Pipe", type: "Message Broker", description: "Stores event payloads securely until processed by downstream consumers." }
          ]
        },
        {
          id: "data" as const,
          name: "Storage & Cache Layer",
          nodes: [
            { id: "redis-metadata", name: "Redis Cluster Cache", type: "Cache", description: "Improves data latency by keeping active record sessions loaded in-memory." },
            { id: "mysql-db", name: "MySQL Primary Cluster", type: "Relational DB", description: "Provides ultimate transaction ledger with guaranteed relational schema." }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "Client Routing Gateway", description: "F5 routes traffic to Apigee gateway which sanitizes headers and checks request limit.", involved_nodes: ["f5-loadbalancer", "apigee-gateway"] },
        { id: "step-2", number: 2, title: "Trigger Business Transaction", description: "Apigee Gateway routes HTTP payload into the Core Application Microservice.", involved_nodes: ["apigee-gateway", "core-service"] },
        { id: "step-3", number: 3, title: "Fetch Cache Session Data", description: "Core Service checks for session data in Redis Cache to skip slow DB queries.", involved_nodes: ["core-service", "redis-metadata"] },
        { id: "step-4", number: 4, title: "Queue Analytical Event", description: "Core service pushes transaction event message to SQS pipeline for background audit logging.", involved_nodes: ["core-service", "sqs-transactions"] },
        { id: "step-5", number: 5, title: "Write Ledger Record", description: "SQS Consumer captures messages and updates permanent ledger indices in MySQL primary database.", involved_nodes: ["sqs-transactions", "mysql-db"] }
      ]
    },
    th: {
      title: "ระบบสถาปัตยกรรมไมโครเซอร์วิสแบบกระจายตัวองค์กร (Distributed Enterprise Platform)",
      description: "โครงสร้างการจัดการระบบคลาวด์และไมโครเซอร์วิสระดับองค์กรที่ทนทาน เหมาะสำหรับตรรกะธุรกิจขนาดใหญ่และซับซ้อน ประกอบด้วย API Gateway เกตเวย์กลางนำเข้าข้อมูล, ระบบคิวอีเวนต์จัดการขั้นตอนหลังบ้าน, แคชข้อมูลเพิ่มความเร็วการเปิดอ่าน, และฐานข้อมูลเชิงสัมพันธ์บันทึกธุรกรรมถาวร",
      layers: [
        {
          id: "presentation" as const,
          name: "เกตเวย์รับส่งข้อมูล (Client Gateways)",
          nodes: [
            { id: "f5-loadbalancer", name: "F5 Load Balancer", type: "CDN", description: "กระจายทราฟฟิกของผู้ใช้ที่หลั่งไหลเข้ามาไปยังกลุ่มเซิร์ฟเวอร์ปากทางอย่างสมดุลและปลอดภัย" },
            { id: "apigee-gateway", name: "Apigee Ingress Gateway", type: "API Gateway", description: "ตรวจสอบสิทธิ์การยิงคีย์ของแอป ตรวจเช็กปริมาณการยิง และกรองที่อยู่ไอพีไม่พึงประสงค์" }
          ]
        },
        {
          id: "application" as const,
          name: "บริการประมวลผล (Core Microservices)",
          nodes: [
            { id: "core-service", name: "Core Application Microservice", type: "Microservice", description: "ประมวลผลธุรกิจหลัก คิดคำนวณราคาสินค้า และดำเนินการจัดการตรรกะระบบที่ซับซ้อน" },
            { id: "helper-service", name: "Auxiliary Data Microservice", type: "Microservice", description: "คอยจัดหาข้อมูลสนับสนุน รันงานย่อย ๆ และประกอบตัวชี้วัดเบื้องหลังให้แอปพลิเคชันหลัก" }
          ]
        },
        {
          id: "queue" as const,
          name: "คิวงานระบบหลังบ้าน (Ingestion Queues)",
          nodes: [
            { id: "sqs-transactions", name: "AWS SQS Event Pipeline", type: "Message Broker", description: "จัดเก็บข้อความอีเวนต์อย่างปลอดภัยตามลำดับงาน ป้องกันไม่ให้แอปพลิเคชันหลังบ้านโหลดหนักจนล่ม" }
          ]
        },
        {
          id: "data" as const,
          name: "ฐานข้อมูลหลัก (Databases & Cache)",
          nodes: [
            { id: "redis-metadata", name: "Redis Session Cache Cluster", type: "Cache", description: "เก็บแคชข้อมูลธุรกรรมเซสชันและพิกัดงานที่ถูกเรียกใช้งานบ่อยเพื่อเร่งความเร็วในการอ่านข้อมูล" },
            { id: "mysql-db", name: "MySQL DB Primary Relational", type: "Relational DB", description: "ฐานข้อมูลหลักเชิงสัมพันธ์ จัดเก็บข้อมูลผู้ใช้และบัญชีแยกประเภทที่มีความเสถียรและความแม่นยำสูง" }
          ]
        }
      ],
      steps: [
        { id: "step-1", number: 1, title: "นำเข้าและจัดสรรข้อมูล", description: "F5 โหลดบาลานซ์สลับรับสายและส่งต่อให้ Apigee ทำความสะอาดหัวจดหมายและเช็กอัตราการยิงข้อมูล", involved_nodes: ["f5-loadbalancer", "apigee-gateway"] },
        { id: "step-2", number: 2, title: "รันงานการทำรายการหลัก", description: "เกตเวย์นำทางข้อมูลเข้าสู่ Core Application เพื่อทำการคำนวณและประมวลผลงานของลูกค้ารายนั้น", involved_nodes: ["apigee-gateway", "core-service"] },
        { id: "step-3", number: 3, title: "เปิดค้นเซสชันประวัติแคช", description: "ตัวแอปพลิเคชันหลักค้นหาประวัติการทำงานในหน่วยความจำ Redis เพื่อเลี่ยงการคิวรีที่ล่าช้าของ DB หลัก", involved_nodes: ["core-service", "redis-metadata"] },
        { id: "step-4", number: 4, title: "โยนธุรกรรมเข้าท่อบันทึก", description: "เซอร์วิสหลักส่งสัญญาณข้อความกิจกรรมโยนเข้าท่อ AWS SQS ปล่อยให้งานตรวจเช็กประวัติวิ่งเบื้องหลังไปเงียบ ๆ", involved_nodes: ["core-service", "sqs-transactions"] },
        { id: "step-5", number: 5, title: "เขียนรายการถาวรลงดีสก์", description: "ระบบแอปฝั่งรับ Captures ข้อความจาก SQS คิวและบันทึกเขียนฐานข้อมูลประวัติถาวรลงใน MySQL Database", involved_nodes: ["sqs-transactions", "mysql-db"] }
      ]
    }
  }
};

/* ─────────────────────────────────────────────────────────────────────────────
   Mock Streams & Dynamic Heuristic Generators
───────────────────────────────────────────────────────────────────────────── */

export function getMockBlueprintStream(prompt: string, language: 'th' | 'en'): Response {
  let presetKey: 'concert' | 'chat' | 'default' = 'default';
  
  if (/concert|ticket|booking|กดบัตร|จองตั๋ว|บัตรคอนเสิร์ต/i.test(prompt)) {
    presetKey = 'concert';
  } else if (/chat|message|line|slack|แชท|ข้อความ|สนทนา/i.test(prompt)) {
    presetKey = 'chat';
  }

  const blueprint = PRESETS[presetKey][language];
  blueprint.title = prompt.trim().length > 5 
    ? `${prompt.trim()} (${language === 'th' ? 'แบบจำลองจำลองความละเอียดสูง' : 'Simulation Mode'})`
    : blueprint.title;

  const jsonString = JSON.stringify(blueprint, null, 2);

  // Set up high-fidelity streaming interface chunk-by-chunk
  const encoder = new TextEncoder();
  let index = 0;
  const chunkSize = 20;

  const stream = new ReadableStream({
    async start(controller) {
      function push() {
        if (index >= jsonString.length) {
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
          return;
        }

        const chunkText = jsonString.slice(index, index + chunkSize);
        index += chunkSize;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
        // Deterministic timing simulation
        setTimeout(push, 8);
      }
      push();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export function getMockResiliency(blueprint: any, language: 'th' | 'en') {
  const layers = blueprint.layers || [];
  const steps = blueprint.steps || [];
  const node_risks: any[] = [];
  
  layers.forEach((layer: any) => {
    (layer.nodes || []).forEach((node: any) => {
      let risk_level = "LOW";
      let risk_title = language === 'th' ? "ทราฟฟิกปกติ" : "Standard Traffic Compliance";
      let solution = language === 'th' ? "รักษาระดับการตั้งค่าปัจจุบันและทำมอนิเตอร์ระดับซีพียู" : "Maintain baseline configurations and track metrics.";

      const type = (node.type || '').toLowerCase();
      const id = (node.id || '').toLowerCase();

      if (type.includes('db') || type.includes('relational') || type.includes('nosql') || id.includes('db')) {
        risk_level = "HIGH";
        risk_title = language === 'th' ? "ความล้มเหลวฐานข้อมูลเดี่ยว (SPOF Primary DB)" : "Database Primary SPOF Risk";
        solution = language === 'th' 
          ? "ติดตั้ง Primary-Replica Read Stream, ทำการแชร์ข้อมูลกระจายจุดบันทึก และเปิดการทำงานสำรองอัตโนมัติ (Failover)" 
          : "Deploy a Primary-Replica replication layout with automated failover and configure connection pooling.";
      } else if (type.includes('cache') || id.includes('cache')) {
        risk_level = "MEDIUM";
        risk_title = language === 'th' ? "ความร้อนและการทลายของแคช (Cache Stampede & OOM)" : "Cache Eviction / Stampede Risk";
        solution = language === 'th' 
          ? "ตั้งค่านโยบายหน่วยความจำแบบ allkeys-lru, ยืดเวลาหมดอายุของกุญแจสำคัญ และล็อกแผงเพื่อไม่ให้อ่านยิงตรงถึงฐานข้อมูลพร้อมกัน" 
          : "Configure allkeys-lru memory policy, add random expiry jitters, and employ mutex locks on database queries.";
      } else if (type.includes('microservice') || id.includes('service')) {
        risk_level = "MEDIUM";
        risk_title = language === 'th' ? "อันตรายบริการคอขวดและทราฟฟิกช้าสะสม (Cascading Latency)" : "Cascading Microservice Timeout";
        solution = language === 'th' 
          ? "ติดตั้ง Circuit Breaker เกราะสวิตช์ปิด-เปิด, กำหนดค่า Timeouts อย่างเข้มงวด และใช้แคชสำหรับผลลัพธ์คิวรีคงที่" 
          : "Implement Circuit Breaker pattern (Resilience4j/Go-breaker), strictly enforce call timeouts, and run HTTP retries.";
      } else if (type.includes('gateway') || type.includes('ingress') || id.includes('gateway') || id.includes('ingress')) {
        risk_level = "HIGH";
        risk_title = language === 'th' ? "ปากทางจราจรติดขัดและการปฏิเสธการเชื่อมต่อ (Ingress DDoS Spike)" : "Edge DDoS Gateway Bottleneck";
        solution = language === 'th' 
          ? "ตั้งค่าอัตราการรับส่งข้อมูลสูงสุดต่อไอพี (Rate Limiting), เปิดใช้บริการ WAF ปลอกเหล็ก และกระจายศูนย์ด้วย DNS โหลดบาลานซ์" 
          : "Enforce dynamic Client Rate Limiting, enable Cloud WAF filters, and scale edge proxies behind geo-DNS balancers.";
      } else if (type.includes('broker') || type.includes('queue') || id.includes('queue') || id.includes('ingest')) {
        risk_level = "LOW";
        risk_title = language === 'th' ? "ข้อมูลอุดตันในท่อคิว (Broker Buffer Saturation)" : "Broker Buffer Saturation";
        solution = language === 'th' 
          ? "สร้างกลุ่ม Consumer เพิ่มขึ้นแบบแนวนอนเพื่อเร่งดึงงาน และกำหนดท่อสำรองงานที่เสีย (Dead Letter Queue)" 
          : "Provision additional consumer partitions horizontally and monitor offset lags with alerting rules.";
      }

      node_risks.push({
        node_id: node.id,
        risk_level,
        risk_title,
        solution
      });
    });
  });

  const step_flows = steps.map((step: any) => {
    const isAsync = /queue|broker|ingest|publish|kafka|rabbit|sqs/i.test(step.description || '') || 
                    step.involved_nodes.some((n: string) => /queue|broker|ingest|kafka|rabbit|sqs/i.test(n));
    return {
      step_number: step.number,
      flow_type: isAsync ? "async" : "sync",
      technical_protocol: isAsync ? "AMQP" : "HTTP"
    };
  });

  return { node_risks, step_flows };
}

export function getMockScale(blueprint: any, prompt: string, language: 'th' | 'en') {
  const isConcert = /concert|ticket|booking|กดบัตร|จองตั๋ว|บัตรคอนเสิร์ต/i.test(prompt);

  const load_estimates = [
    {
      tier: "Small" as const,
      concurrent_users: "1,500 Users",
      requests_per_second: "100 RPS",
      server_spec: "1x Cloud VPS VM (1 vCPU, 2GB RAM, SSD)"
    },
    {
      tier: "Medium" as const,
      concurrent_users: "50,000 Users",
      requests_per_second: "3,000 RPS",
      server_spec: "3x Backend Pods (Docker) + Managed PostgreSQL (4 vCPU, 16GB RAM)"
    },
    {
      tier: "Large" as const,
      concurrent_users: isConcert ? "1,000,000 Users" : "500,000 Users",
      requests_per_second: isConcert ? "60,000 RPS" : "30,000 RPS",
      server_spec: "Kubernetes Cluster Auto-scaled + Distributed Redis Sharding (3 Nodes) + DB Read Replication"
    }
  ];

  const deploy_stages = [
    {
      stage: "Stage 1" as const,
      title: language === 'th' ? "ระยะเริ่มต้น - สถาปัตยกรรม VM เดี่ยว (MVP Setup)" : "Stage 1 - Single-Host Virtual VPS (MVP Setup)",
      pros: language === 'th' 
        ? ["ราคาประหยัดอย่างมาก เหมาะสำหรับเริ่มต้นระบบ", "ความซับซ้อนในการตั้งค่าและดีพลอยต่ำมาก"] 
        : ["Extremely cost-effective, zero deployment overhead", "Fastest setup, ideal for prototype validation"],
      cons: language === 'th' 
        ? ["มีความเสี่ยงคอขวดสูงเมื่อทราฟฟิกเริ่มไหลเข้ามา", "หากเครื่องแม่ข่ายดับ ระบบจะล่มโดยสมบูรณ์ (SPOF)"] 
        : ["Lacks hardware high-availability backup systems", "Highly vulnerable to traffic bottlenecks under spikes"],
      estimated_cost: "$15 / month"
    },
    {
      stage: "Stage 2" as const,
      title: language === 'th' ? "ระยะเติบโต - สเกลออกด้วยตู้คอนเทนเนอร์ (Containerized Scale)" : "Stage 2 - Containerized Microservices Layout",
      pros: language === 'th' 
        ? ["แยกตรรกะระบบและการประมวลผลออกจากกันได้เด็ดขาด", "ฐานข้อมูลเสถียรขึ้นมากด้วยระบบคลาวด์คุม (Managed DB)"] 
        : ["Decouples database engines from core microservice instances", "Easier container updates and database automatic snapshots"],
      cons: language === 'th' 
        ? ["ยังไม่มีฟังก์ชันปรับจำนวนโหนดอัตโนมัติตามปริมาณคนเข้าใช้งาน", "งบประมาณเริ่มเพิ่มสูงตามสเปกเครื่องคลาวด์และเซอร์วิสแยก"] 
        : ["No automatic node scaling (manual scaling required)", "Increased configuration routing management in production"],
      estimated_cost: "$280 / month"
    },
    {
      stage: "Stage 3" as const,
      title: language === 'th' ? "ระยะสเกลสูงสุด - คลัสเตอร์ระบบปรับระดับอัตโนมัติ (HA K8s Cluster)" : "Stage 3 - Elastic High-Availability Kubernetes Cluster",
      pros: language === 'th' 
        ? ["ขยายปริมาณเครื่องรับทราฟฟิกได้เองอัตโนมัติ (Auto-scaling)", "มีความทนทานต่อความเสียหายระดับดีเยี่ยม ไม่มีคำว่าล่ม"] 
        : ["Handles dynamic traffic surges with instant pods horizontal auto-scaling", "Highly fault-tolerant architectural cluster with distributed sharding"],
      cons: language === 'th' 
        ? ["ระบบมีความละเอียดและตั้งค่าซับซ้อนสูง (DevOps Overhead สูง)", "ค่าใช้จ่ายรายเดือนสูง เหมาะสำหรับองค์กรขนาดใหญ่หรือโปรเจกต์ทุนหนา"] 
        : ["Requires specialized professional DevOps oversight to manage configurations", "Substantial monthly cloud infrastructure cost allocation"],
      estimated_cost: "$2,400 / month"
    }
  ];

  const optimization_configs = {
    nginx: `# Nginx Web Proxy & Gateway Optimized Tuning Block
events {
    worker_connections 8192;
    use epoll;
    multi_accept on;
}

http {
    keepalive_timeout 65;
    keepalive_requests 1000;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;

    # Dynamic Ingestion Buffers
    client_body_buffer_size 128k;
    client_max_body_size 10m;
    client_header_buffer_size 1k;

    upstream backend_nodes {
        server booking-service:8080 max_fails=3 fail_timeout=10s;
        keepalive 64;
    }

    server {
        listen 80 reuseport;
        server_name api.workflow.designer;

        location / {
            proxy_pass http://backend_nodes;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}`,
    postgres: `-- Tuning PostgreSQL Primary Engine for High Concurrent Writes
-- Optimized for write-heavy ledger persistence logs

ALTER SYSTEM SET max_connections = 600;
ALTER SYSTEM SET shared_buffers = '4GB';       -- 25% of 16GB RAM recommendation
ALTER SYSTEM SET effective_cache_size = '12GB'; -- 75% of RAM
ALTER SYSTEM SET work_mem = '64MB';
ALTER SYSTEM SET maintenance_work_mem = '1GB';

# High Throughput Write Tuning
ALTER SYSTEM SET wal_buffers = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET synchronous_commit = off;    -- Decouples disk write wait from REST response!`,
    redis: `# Redis Clustered High Performance Configuration
# Tuned for high-density fast mutex seat-locks / presences

maxmemory 3gb
maxmemory-policy allkeys-lru
tcp-backlog 65536
save ""                                 # Turn off standard RDB write to optimize disk I/O
appendonly yes
appendfsync everysec
lazyfree-lazy-eviction yes
lazyfree-lazy-expire yes
lazyfree-lazy-server-del yes`
  };

  const monitoring_checklist = language === 'th' ? [
    "ตั้งค่าแจ้งเตือนสวิงแจ้งเหตุการณ์ทันทีเมื่อ CPU usage ทะลุเกิน 80% เป็นเวลาต่อเนื่อง 3 นาทีใน API Gateway",
    "ตรวจสอบอัตราการขับเคลื่อนแคช (Redis Eviction Rate) ป้องกันหน่วยความจำหมดกะทันหัน",
    "บันทึกรอยต่อคิวช้า (Slow Query Log) ค้นหาและทำดัชนีคิวรีการเขียนที่ช้าเกิน 150ms บนฐานข้อมูล",
    "เชื่อมโยงระบบท่อคิวสำรองข้อความเสีย (Dead Letter Queue - DLQ) ของทราฟฟิกส่งไม่ผ่านขึ้นแจ้งเตือน",
    "วิเคราะห์ตัวชี้วัด Cache Hit Ratio ของหน้าเว็บบน CDN ให้อยู่สูงกว่าระดับมาตรฐาน 90% เสมอ"
  ] : [
    "Configure dynamic alert rules when Edge API Gateway CPU utilization exceeds 80% for 3 consecutive minutes.",
    "Monitor Redis memory consumption and eviction velocity to safeguard against unexpected OOM failures.",
    "Activate PostgreSQL slow query logging to isolate, index, and profile operations exceeding 150ms.",
    "Setup DLQ alert streams on brokers to instantly flag failed or un-consumed transaction messages.",
    "Maintain edge Cloud CDN cache hit ratio above 90% benchmark target to insulate core servers."
  ];

  return { load_estimates, deploy_stages, optimization_configs, monitoring_checklist };
}

export function getMockPrompts(blueprint: any, scaleInfo: any, language: 'th' | 'en') {
  const explanation = language === 'th' 
    ? "✦ ข้อมูลพิมพ์เขียวนี้ถูกจัดสรรออกเป็น 3 ขั้นตอนการพัฒนาหลักแบบก้าวหน้า เพื่อช่วยให้วิศวกรผู้ใช้และปัญญาประดิษฐ์ปลายน้ำรันงานได้อย่างแม่นยำ ปราศจากปัญหาโทเคนล้นขีดจำกัด" 
    : "✦ Dynamic progressive development strategy compiled. Slicing complex system layout into three incremental stages to protect downline prompt tokens.";

  const p1_title = language === 'th' ? "เฟส 1: การออกแบบฐานข้อมูล แผนผัง และแคชล็อกที่นั่ง" : "Phase 1: Database Schema & High-Speed Cache Locks";
  const p1_desc = language === 'th' 
    ? "จัดระเบียบตารางและเอนทิตีที่จำเป็น พร้อมตั้งค่าแคชประสิทธิภาพสูงเพื่อล็อกข้อมูลที่นั่งแบบกระจายตัว" 
    : "Provision target database primary entities, write optimized composite indexes, and design Redis atomic lock interfaces.";
  
  const p1_prompt = `### Downstream AI Role: Lead Senior DB & Storage Engineer
You are acting as an Elite Relational Database & Redis Caching expert. Your task is to implement the storage layer for our system based on the designated blueprint: "${blueprint.title}".

#### Technical Target Specifications:
1. Define PostgreSQL schemas matching the relational tables needed.
2. Formulate high-performance composite SQL indices on active primary keys.
3. Code safe, atomic Go/TypeScript scripts to handle Redis Distributed Locks (e.g., SETNX with expirations) to guarantee seat/session locking with zero race conditions.

#### Code Quality Guardrails:
* Do NOT use generic raw queries without parameter sanitation (avoid SQL Injections).
* Incorporate robust connection pools and error retry logic.
* Strictly enforce a 10-minute automatic lock release on seating keys in Redis.`;

  const p2_title = language === 'th' ? "เฟส 2: การพัฒนาไมโครเซอร์วิสหลักและตรรกะประมวลผลงาน" : "Phase 2: Core Microservices & Business Application Logic";
  const p2_desc = language === 'th' 
    ? "ลงมือรันโค้ดเขียนสถาปัตยกรรม APIs หลัก จัดการตรรกะจอง/แชท ด้วยแนวทางวิเคราะห์ทีละเซอร์วิสแบบอุดเกราะ" 
    : "Implement business-critical backend application services. Enforces service-by-service template isolation to prevent token exhaustion.";
  
  const p2_prompt = `### Downstream AI Role: Expert Backend Microservices Developer
You are tasked with building the application core microservices specified in the system blueprint.
Follow the **Service-by-Service Focus** strategy: implement the master reference microservice first with full test coverages, then proceed to the other backing microservices.

#### Master Reference Implementation Targets:
* Language stack preferred: Go or Node.js.
* Clean architecture approach: Controller layer -> Service/Use Case layer -> Repository Interface -> Database Repository.
* Include Mock Repository files to support comprehensive unit tests.

#### Business Logic Constraints:
1. Check session auth tokens against jwt headers securely.
2. Invoke seat cache checks before posting order items to downstream queues.`;

  const p3_title = language === 'th' ? "เฟส 3: ท่อส่งข้อมูลคิว อิมเมจระบบ และเกตเวย์รับทราฟฟิก" : "Phase 3: Asynchronous Message Queue, Gateway Routing, and Edge Protection";
  const p3_desc = language === 'th' 
    ? "เชื่อมท่อคิวคัดกรองงานแบบเบื้องหลัง (Async Queue Consumer) เข้าหาฐานข้อมูลหลัก และตั้งเกตเวย์หน้าด่านสำหรับกระจายงาน" 
    : "Connect real-time broker exchanges (Kafka/RabbitMQ), build asynchronous background workers, and configure Nginx Ingress route paths.";
  
  const p3_prompt = `### Downstream AI Role: Principal DevOps & Distributed Integration Specialist
Your task is to build and orchestrate the external gateways and message pipelines that bind our layers together.

#### Execution Tasks:
1. Write a complete Async Consumer Daemon that pulls batch messages from the queue and handles batch database insert.
2. Build Nginx ingress gateway routing directives linking endpoints to auth-service and booking-service.
3. Configure robust retry policies and Dead Letter Queues (DLQ) to capture un-processable payloads.`;

  const phases = [
    {
      phase_number: 1,
      title: p1_title,
      description: p1_desc,
      target_nodes: ["redis-cache", "postgres-db", "redis-presence", "mongodb-messages", "redis-metadata", "mysql-db"],
      ai_role: language === 'th' ? "วิศวกรผู้เชี่ยวชาญด้านระบบฐานข้อมูลหลักและเครื่องมือจูนแคช" : "Expert Database Administrator & Storage Specialist",
      ai_instructions_prompt: p1_prompt,
      definition_of_done: language === 'th' ? [
        "สคริปต์ SQL สร้างโครงสร้างตารางหลักและดัชนี Index รันผ่านสำเร็จ 100%",
        "ฟังก์ชันดีไซน์ Redis Distributed Lock จัดการสภาวะแย่งชิง (Race Conditions) ได้อย่างสมบูรณ์แบบ",
        "ระบบเชื่อมต่อฐานข้อมูลมีกลไก Pool จัดการและการทำ Error Handling เมื่อคิวรี่หลุด"
      ] : [
        "PostgreSQL SQL schema tables and composite indexing scripts execute successfully on testing container.",
        "Redis SETNX locks prevent double-booking or seat collisions successfully in multi-threaded simulation.",
        "DB connection pool configuration limits timeouts under persistent 500 concurrent connections."
      ]
    },
    {
      phase_number: 2,
      title: p2_title,
      description: p2_desc,
      target_nodes: ["auth-service", "booking-service", "chat-service", "user-service", "core-service", "helper-service"],
      ai_role: language === 'th' ? "วิศวกรแอปพลิเคชันแบ็คเอนด์และผู้เชี่ยวชาญการออกแบบไมโครเซอร์วิส" : "Senior Backend Application & Microservices Engineer",
      ai_instructions_prompt: p2_prompt,
      definition_of_done: language === 'th' ? [
        "เซอร์วิสหลักสร้างขึ้นและสัญญารันผ่านพอร์ตทดสอบได้ตามเป้าหมาย",
        "ตรรกะระบบเช็กข้อมูลแคช และตรวจสอบ JWT Token ผ่านอย่างเสถียร",
        "มีไฟล์ Unit Tests จำลอง Mock Database ครอบคลุมฟังก์ชันการทำงานอย่างน้อย 85% ของไลน์โค้ด"
      ] : [
        "Application service builds successfully and mounts on designated local server port.",
        "REST/RESTful endpoints validate incoming request signatures and intercept bad inputs.",
        "Unit tests using mock repositories pass, achieving at least 80% code coverage on core logic."
      ]
    },
    {
      phase_number: 3,
      title: p3_title,
      description: p3_desc,
      target_nodes: ["cdn-cloudflare", "nginx-ingress", "kafka-ingest", "dns-route53", "websocket-gateway", "rabbitmq-broker", "f5-loadbalancer", "apigee-gateway", "sqs-transactions"],
      ai_role: language === 'th' ? "สถาปนิกด้านวิศวกรรม DevOps และระบบบูรณาการโครงสร้างเครือข่ายกระจายตัว" : "Lead DevOps & Distributed Systems Architect",
      ai_instructions_prompt: p3_prompt,
      definition_of_done: language === 'th' ? [
        "ผู้บริโภคข้อมูลคิวงาน (Consumer Daemon) รับส่งงานบันทึกแบบ Batch ลง DB ได้สมบูรณ์",
        "Nginx / Gateway นำทางลิ้งก์ปลายทางอย่างถูกต้อง และเปิดใช้ฟังก์ชันรักษาความปลอดภัยอย่างเข้มงวด",
        "ฟังก์ชันอุดความเสียหายทางเครือข่ายรันผ่าน และกักเก็บงานล้มเหลวลงกล่อง DLQ อัตโนมัติ"
      ] : [
        "Queue consumer daemon processes batch entries and persists to the database under spike simulations.",
        "Nginx ingress reverse proxy routes paths correctly to core applications with functional Gzip compression.",
        "DDoS simulation triggers Gateway rate limiter, yielding 429 Too Many Requests to target hosts."
      ]
    }
  ];

  return { explanation, phases };
}

export function getMockInfrastructureCode(blueprint: any, techStack: string, language: 'th' | 'en') {
  const explanation = language === 'th' 
    ? "✦ โค้ดอินฟราสร้างเสร็จเรียบร้อย! คัดสรรเฉพาะแอปและฐานข้อมูลตามสถาปัตยกรรม ออกมาเป็นแบบจำลอง Docker Compose และชุดไฟล์ควบคุมเพื่อรันในคอมพิวเตอร์ของคุณ" 
    : "✦ Infrastructure files successfully synthesized! Tailored containers generated strictly matching nodes in blueprint.";

  const files = {
    "docker-compose.yml": `version: '3.8'

services:
  # ── Presentation Layer ──
  api-gateway:
    image: nginx:alpine
    container_name: workflow-nginx-gateway
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - core-app-service
    networks:
      - workflow-net

  # ── Application Layer ──
  core-app-service:
    image: node:18-alpine
    container_name: workflow-app-container
    environment:
      - NODE_ENV=production
      - PORT=8080
      - REDIS_URL=redis://redis-cache:6373/0
      - DB_HOST=postgres-db
      - DB_USER=admin
      - DB_PASSWORD=securepassword
      - DB_NAME=ledger
      - KAFKA_BOOTSTRAP_SERVERS=kafka-broker:9092
    expose:
      - "8080"
    networks:
      - workflow-net

  # ── Queue Layer ──
  kafka-broker:
    image: confluentinc/cp-kafka:latest
    container_name: workflow-kafka-broker
    ports:
      - "9092:9092"
    environment:
      - KAFKA_NODE_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper-host:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka-broker:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    networks:
      - workflow-net

  zookeeper-host:
    image: confluentinc/cp-zookeeper:latest
    container_name: workflow-zookeeper
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181
    networks:
      - workflow-net

  # ── Data Layer ──
  redis-cache:
    image: redis:7-alpine
    container_name: workflow-redis-cache
    expose:
      - "6379"
    command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
    networks:
      - workflow-net

  postgres-db:
    image: postgres:15-alpine
    container_name: workflow-postgres-db
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=securepassword
      - POSTGRES_DB=ledger
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - workflow-net

volumes:
  pgdata:

networks:
  workflow-net:
    driver: bridge`,

    "nginx.conf": `user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    upstream app_servers {
        server core-app-service:8080;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://app_servers;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Custom Healthcheck endpoint
        location /healthz {
            return 200 '{"status":"healthy"}';
            add_header Content-Type application/json;
        }
    }
}`,

    "README.md": language === 'th' ? `# 🐳 สถาปัตยกรรมจำลองการรันระบบ DevOps ด้วยค่าย Docker Compose

ไฟล์อินฟราโครงข่ายระดับวิสาหกิจถูกประดิษฐ์ขึ้นตามสถาปัตยกรรมพิมพ์เขียวของคุณเพื่อการเปิดเครื่องรันงานจริงในทันที

## 🚀 วิธีการทดสอบรันเครื่องในคอมพิวเตอร์ของคุณ

1. **เตรียมไฟล์ควบคุมให้พร้อม**:
   คัดลอกไฟล์ \`docker-compose.yml\` และ \`nginx.conf\` จัดเรียงให้อยู่ในโฟลเดอร์เดียวกันของโปรเจกต์ของคุณ

2. **สั่งการปล่อยตู้อัพขึ้นระบบ**:
   เปิดโปรแกรม Terminal หรือ Command Prompt ในที่เก็บไฟล์ และพิมพ์สั่งรัน:
   \`\`\`bash
   docker compose up -d
   \`\`\`

3. **ตรวจสอบสภาพความปลอดภัยของแอป**:
   เมื่อคอนเทนเนอร์ทั้งหมดเปิดเสร็จ ให้ทดสอบจุดเชื่อมต่อ (Healthcheck Endpoint) ด้วยเบราว์เซอร์หรือคำสั่ง curl:
   \`\`\`bash
   curl http://localhost/healthz
   \`\`\`

4. **ตรวจสอบตรรกะระบบไมโครเซอร์วิส**:
   \`\`\`bash
   docker compose ps
   \`\`\`
   เพื่อดูว่าหน่วย PostgreSQL, Redis, Kafka และ Nginx รันอยู่พอร์ตใดและท่อสัญญาณทำงานได้เสถียรหรือไม่!` 
    : `# 🐳 Production Simulation DevOps Stack

These high-fidelity infrastructure templates have been synthesized according to your custom microservices graph nodes.

## 🚀 Getting Started & Local Orchestration

1. **Workspace File Alignment**:
   Place the generated \`docker-compose.yml\` and \`nginx.conf\` in the same working directory.

2. **Launch Container Services**:
   Open a terminal terminal prompt in the folder and execute the boot command:
   \`\`\`bash
   docker compose up -d
   \`\`\`

3. **Verify Cluster Health**:
   Check if the Ingress gateway routes the healthcheck checks successfully:
   \`\`\`bash
   curl http://localhost/healthz
   \`\`\`

4. **Trace Container Output Logs**:
   \`\`\`bash
   docker compose logs -f core-app-service
   \`\`\``
  };

  return { explanation, files };
}

export function getMockReverseEngineer(payload: any, language: 'th' | 'en') {
  const isGithub = !!payload.repoUrl;
  const repoName = isGithub ? payload.repoUrl.split('/').pop().replace('.git', '') : 'Uploaded ZIP Project';

  const explanation = language === 'th'
    ? `✦ สำเร็จ! ทำการย้อนศรวิเคราะห์โค้ดฐานงานระบบจาก "${repoName}" โดยตรวจพบไฟล์โปรเจกต์ โครงสร้างแพกเกจ และไมโครเซอร์วิสทั้งหมดบนระบบแฝง สังเคราะห์ออกมาเป็นแผนผัง 4-Tier Blueprint Canvas แล้วเรียบร้อย!`
    : `✦ Reverse engineering codebase structure completed! Scanned configurations and framework dependencies from "${repoName}" to synthesize layout.`;

  const blueprint = PRESETS.default[language];
  blueprint.title = language === 'th'
    ? `ระบบจากการถอดรหัสรอยต่อโค้ด: ${repoName}`
    : `Synthesized Codebase: ${repoName}`;

  return { explanation, blueprint };
}

export function getMockModifyBlueprint(blueprint: any, prompt: string, language: 'th' | 'en') {
  const explanation = language === 'th'
    ? `✦ ดำเนินการปรับปรุงสถาปัตยกรรมระบบจำลองตามคำสั่งปรับแต่งของคุณ: "${prompt}" เรียบร้อย!`
    : `✦ System modification request executed successfully in simulation mode: "${prompt}"`;

  const isNoSql = /mongo|nosql|document/i.test(prompt);
  const isSecurity = /auth0|cognito|security|secure/i.test(prompt);

  const nodes_to_add_or_update: any[] = [];
  const nodes_to_remove: string[] = [];
  const steps_updated: any[] = [];

  if (isNoSql) {
    // Replace postgres-db or mysql-db with MongoDB Atlas
    const targetLayer = 'data';
    nodes_to_remove.push('postgres-db', 'mysql-db');
    nodes_to_add_or_update.push({
      node_id: "mongodb-atlas",
      layer_id: "data",
      node_name: language === 'th' ? "MongoDB Atlas Cluster" : "MongoDB Atlas Cluster",
      description: language === 'th' 
        ? "ระบบจัดเก็บข้อความและเอกสารธุรกรรมประสิทธิภาพสูง สเกลโหลดแนวราบได้ลื่นไหล" 
        : "Fully managed multi-region NoSQL document database configured for high horizontal read scale.",
      type: "NoSQL DB"
    });
    steps_updated.push({
      step_number: 5,
      title: language === 'th' ? "บันทึกข้อมูลถาวรลง Document" : "Persist Document to Atlas NoSQL",
      description: language === 'th' 
        ? " Consumer อ่านข้อความและบันทึกออเดอร์ในรูปแบบ BSON เอกสารลงฐานข้อมูล MongoDB" 
        : "Background consumer parses payload logs and persists direct document to MongoDB storage.",
      involved_nodes: ["kafka-ingest", "sqs-transactions", "mongodb-atlas"]
    });
  } else if (isSecurity) {
    nodes_to_add_or_update.push({
      node_id: "auth0-gateway",
      layer_id: "presentation",
      node_name: "Auth0 identity Portal",
      description: language === 'th' 
        ? "ระบบตรวจสอบและยืนยันตัวตนความปลอดภัยระดับองค์กร ปกป้องสิทธิ์ผู้ใช้แอป" 
        : "Enterprise-grade cloud IAM user provider enforcing OAuth2/OIDC standards.",
      type: "API Gateway"
    });
    steps_updated.push({
      step_number: 2,
      title: language === 'th' ? "คัดกรองและรับรองสิทธิ์ผู้ใช้" : "Authenticate Identity Session",
      description: language === 'th' 
        ? "ยิงตรวจสอบ Token สิทธิ์ความปลอดภัยผ่านกลไกภายนอก Auth0 เพื่อรับประกันผู้ใช้งานจริง" 
        : "Validates active user signature and token payloads through federated OIDC Auth0 endpoints.",
      involved_nodes: ["nginx-ingress", "apigee-gateway", "auth0-gateway", "auth-service"]
    });
  } else {
    // Default dynamic mock change: add a custom modified node
    const randomId = `sim-node-${Date.now().toString().slice(-4)}`;
    nodes_to_add_or_update.push({
      node_id: randomId,
      layer_id: "application",
      node_name: language === 'th' ? `โมดูลจราจรสภาพจำลอง (${prompt})` : `Simulated Service Node`,
      description: language === 'th' 
        ? `เซอร์วิสเสริมวิเคราะห์ทราฟฟิกรองรับคำแนะนำจูนระบบ: ${prompt}` 
        : `An auxiliary node dynamically provisioned based on modification requirements: "${prompt}"`,
      type: "Microservice"
    });
    steps_updated.push({
      step_number: 3,
      title: language === 'th' ? "ส่งต่อสัญญาณผ่านเซอร์วิสเสริม" : "Relay through Auxiliary service",
      description: language === 'th' 
        ? `ตรรกะระบบกระโดดผ่านจุดประมวลผลคำแนะนำ: ${prompt}` 
        : `Intermediary step processing instructions through dynamically generated services.`,
      involved_nodes: ["booking-service", "core-service", randomId, "redis-cache", "redis-metadata"]
    });
  }

  return {
    explanation,
    modifications: {
      nodes_to_add_or_update,
      nodes_to_remove,
      steps_updated,
      steps_to_remove: []
    }
  };
}
