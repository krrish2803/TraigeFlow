type TableSchema = Record<string, string>;
type RecordData = Record<string, unknown>;

interface MemoryStore {
  tables: Map<string, TableSchema>;
  records: Map<string, Map<string, RecordData>>;
  agents: Map<string, AgentConfig>;
  workflows: Map<string, WorkflowConfig>;
  functions: Map<string, FunctionConfig>;
  schedules: Map<string, ScheduleConfig>;
  files: Map<string, FileEntry>;
}

interface AgentConfig {
  name: string;
  description: string;
  model: string;
  system_prompt: string;
  tools: string[];
  input_schema: Record<string, string>;
}

interface WorkflowConfig {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export interface FunctionConfig {
  name: string;
  handler: string;
  input_schema: Record<string, string>;
}

interface ScheduleConfig {
  name: string;
  workflow_name: string;
  schedule_type: "cron" | "webhook";
  cron?: string;
  input: Record<string, unknown>;
}

interface FileEntry {
  id: string;
  name: string;
  content: string;
  namespace: string;
  created_at: string;
}

interface QueryResult {
  rows: Record<string, unknown>[];
  rowCount: number;
}

class TablesManager {
  constructor(private store: MemoryStore) {}
  async create(name: string, schema: TableSchema): Promise<void> {
    if (this.store.tables.has(name)) throw new Error(`Table ${name} already exists`);
    this.store.tables.set(name, schema);
    this.store.records.set(name, new Map());
  }
  async list(): Promise<{ name: string; schema: TableSchema }[]> {
    return Array.from(this.store.tables.entries()).map(([name, schema]) => ({ name, schema }));
  }
  async get(name: string): Promise<TableSchema | null> {
    return this.store.tables.get(name) ?? null;
  }
}

class RecordsManager {
  constructor(private store: MemoryStore) {}
  async create(table: string, data: RecordData): Promise<RecordData> {
    const records = this.store.records.get(table);
    if (!records) throw new Error(`Table ${table} not found`);
    const id = (data.id as string) || crypto.randomUUID();
    const record = { ...data, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    records.set(id, record);
    return record;
  }
  async get(table: string, id: string): Promise<RecordData | null> {
    const records = this.store.records.get(table);
    return records?.get(id) ?? null;
  }
  async update(table: string, id: string, data: Partial<RecordData>): Promise<RecordData> {
    const records = this.store.records.get(table);
    if (!records) throw new Error(`Table ${table} not found`);
    const existing = records.get(id);
    if (!existing) throw new Error(`Record ${id} not found in ${table}`);
    const updated = { ...existing, ...data, updated_at: new Date().toISOString() };
    records.set(id, updated);
    return updated;
  }
  async delete(table: string, id: string): Promise<void> {
    const records = this.store.records.get(table);
    records?.delete(id);
  }
  async list(table: string, filter?: Partial<RecordData>): Promise<RecordData[]> {
    const records = this.store.records.get(table);
    if (!records) return [];
    let items = Array.from(records.values());
    if (filter) {
      items = items.filter((r) =>
        Object.entries(filter).every(([k, v]) => r[k] === v)
      );
    }
    return items;
  }
  async count(table: string): Promise<number> {
    return this.store.records.get(table)?.size ?? 0;
  }
}

class AgentsManager {
  constructor(private store: MemoryStore) {}
  async register(config: AgentConfig): Promise<void> {
    this.store.agents.set(config.name, config);
  }
  async get(name: string): Promise<AgentConfig | null> {
    return this.store.agents.get(name) ?? null;
  }
  async list(): Promise<AgentConfig[]> {
    return Array.from(this.store.agents.values());
  }
}

class ConversationsManager {
  constructor(private store: MemoryStore) {}
  async run(agentName: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const agent = this.store.agents.get(agentName);
    if (!agent) throw new Error(`Agent ${agentName} not found`);
    return { agent: agentName, input, output: {}, status: "completed" };
  }
  async stream(agentName: string, input: Record<string, unknown>): Promise<AsyncIterable<unknown>> {
    const agent = this.store.agents.get(agentName);
    if (!agent) throw new Error(`Agent ${agentName} not found`);
    return {
      [Symbol.asyncIterator]() {
        let done = false;
        return {
          next() {
            if (done) return Promise.resolve({ done: true, value: null });
            done = true;
            return Promise.resolve({ done: false, value: { type: "complete", agent: agentName, input } });
          },
        };
      },
    };
  }
}

class WorkflowsManager {
  private runs: Map<string, { workflow: string; status: string; step: number; waits: Map<string, unknown> }> = new Map();

  constructor(private store: MemoryStore, private recordsManager: RecordsManager) {}

  async register(config: WorkflowConfig): Promise<void> {
    this.store.workflows.set(config.name, config);
  }

  async get(name: string): Promise<WorkflowConfig | null> {
    return this.store.workflows.get(name) ?? null;
  }

  async list(): Promise<WorkflowConfig[]> {
    return Array.from(this.store.workflows.values());
  }

  async start(workflowName: string, input: Record<string, unknown>): Promise<{ run_id: string; status: string }> {
    const workflow = this.store.workflows.get(workflowName);
    if (!workflow) throw new Error(`Workflow ${workflowName} not found`);
    const run_id = crypto.randomUUID();
    this.runs.set(run_id, { workflow: workflowName, status: "running", step: 0, waits: new Map() });
    this.store.records.get("action_log")?.set(run_id, {
      id: run_id,
      event_type: "workflow_started",
      entity_type: "workflow",
      entity_id: run_id,
      actor: "system",
      metadata: { workflow: workflowName, input },
      created_at: new Date().toISOString(),
    });
    return { run_id, status: "started" };
  }

  async resume(runId: string, waitId: string, data: Record<string, unknown>): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Run ${runId} not found`);
    run.waits.set(waitId, data);
    run.status = "resumed";
  }

  async getRun(runId: string): Promise<{ run_id: string; workflow: string; status: string; step: number } | null> {
    const run = this.runs.get(runId);
    if (!run) return null;
    return { run_id: runId, ...run };
  }
}

class SchedulesManager {
  constructor(private store: MemoryStore) {}
  async create(config: ScheduleConfig): Promise<void> {
    this.store.schedules.set(config.name, config);
  }
  async list(): Promise<ScheduleConfig[]> {
    return Array.from(this.store.schedules.values());
  }
  async get(name: string): Promise<ScheduleConfig | null> {
    return this.store.schedules.get(name) ?? null;
  }
  async delete(name: string): Promise<void> {
    this.store.schedules.delete(name);
  }
}

class FunctionsManager {
  constructor(private store: MemoryStore) {}
  async register(config: FunctionConfig): Promise<void> {
    this.store.functions.set(config.name, config);
  }
  async run(name: string, input: Record<string, unknown>): Promise<Record<string, unknown>> {
    const fn = this.store.functions.get(name);
    if (!fn) throw new Error(`Function ${name} not found`);
    return { function: name, input, output: {}, status: "completed" };
  }
  async list(): Promise<FunctionConfig[]> {
    return Array.from(this.store.functions.values());
  }
}

class FilesManager {
  private files: Map<string, FileEntry> = new Map();
  async create(entry: { name: string; content: string; namespace: string }): Promise<FileEntry> {
    const file: FileEntry = {
      id: crypto.randomUUID(),
      name: entry.name,
      content: entry.content,
      namespace: entry.namespace,
      created_at: new Date().toISOString(),
    };
    this.files.set(file.id, file);
    return file;
  }
  async get(id: string): Promise<FileEntry | null> {
    return this.files.get(id) ?? null;
  }
  async search(query: { query: string; namespace: string; limit: number }): Promise<{ files: FileEntry[] }> {
    const results = Array.from(this.files.values())
      .filter((f) => f.namespace === query.namespace && (f.name.includes(query.query) || f.content.includes(query.query)))
      .slice(0, query.limit);
    return { files: results };
  }
  async list(): Promise<FileEntry[]> {
    return Array.from(this.files.values());
  }
}

class DatastoreManager {
  constructor(private store: MemoryStore) {}
  async query(sql: string, params?: unknown[]): Promise<QueryResult> {
    void sql; void params;
    const rows: Record<string, unknown>[] = [];
    Array.from(this.store.records.entries()).forEach(([, records]) => {
      Array.from(records.values()).forEach((record) => {
        rows.push(record);
      });
    });
    return { rows, rowCount: rows.length };
  }
}

class IntegrationsManager {
  async sendSlackMessage(webhookUrl: string, payload: unknown): Promise<Response> {
    return fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  async sendGmail(to: string, subject: string, body: string): Promise<void> {
    void to; void subject; void body;
  }
}

export class LemmaClient {
  private initialized = false;
  private store: MemoryStore = {
    tables: new Map(),
    records: new Map(),
    agents: new Map(),
    workflows: new Map(),
    functions: new Map(),
    schedules: new Map(),
    files: new Map(),
  };

  tables: TablesManager;
  records: RecordsManager;
  agents: AgentsManager;
  conversations: ConversationsManager;
  workflows: WorkflowsManager;
  schedules: SchedulesManager;
  functions: FunctionsManager;
  files: FilesManager;
  datastore: DatastoreManager;
  integrations: IntegrationsManager;

  constructor(private config: { podId: string; apiKey?: string; apiUrl?: string }) {
    this.tables = new TablesManager(this.store);
    this.records = new RecordsManager(this.store);
    this.agents = new AgentsManager(this.store);
    this.conversations = new ConversationsManager(this.store);
    this.workflows = new WorkflowsManager(this.store, this.records);
    this.schedules = new SchedulesManager(this.store);
    this.functions = new FunctionsManager(this.store);
    this.files = new FilesManager();
    this.datastore = new DatastoreManager(this.store);
    this.integrations = new IntegrationsManager();
  }

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  async destroy(): Promise<void> {
    this.initialized = false;
  }

  get podId(): string {
    return this.config.podId;
  }

  get isInitialized(): boolean {
    return this.initialized;
  }
}

const globalForLemma = globalThis as unknown as { lemmaClient?: LemmaClient };

const lemmaClient = globalForLemma.lemmaClient ?? new LemmaClient({
  podId: process.env.LEMMA_POD_ID || "feedback-to-fix-dev",
  apiKey: process.env.LEMMA_API_KEY,
  apiUrl: process.env.LEMMA_API_URL || "http://localhost:4000/api",
});

globalForLemma.lemmaClient = lemmaClient;

export default lemmaClient;
