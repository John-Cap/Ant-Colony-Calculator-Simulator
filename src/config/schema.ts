// src/config/schema.ts
export type Id = string;

export interface CellSpec {
    id: Id;
    role: string;                 // semantic role within the component: 'inA'|'inB'|'pin'|'out'|'Var'|'IdxLo'|'Value'|...
    tags?: string[];              // free-form: ['Input'], ['Actuator'], etc.
    x: number; y: number; w: number; h: number;
    capacity?: number;            // default 1
}

export interface ComponentSpec {
    id: Id;
    type: string;                 // eg, 'GateAND' | 'GateXOR' | 'MemoryRow' | 'Repo' | ...
    solid?: boolean;
    x: number; y: number; w: number; h: number;
    cells: CellSpec[];
    children?: ComponentSpec[];   // optional nesting
    // optional static metadata the driver may read (e.g., truth-tables, labels)
    props?: Record<string, unknown>;
}

export interface SectorSpec {
    id: Id;
    x: number; y: number; w: number; h: number;
    components: ComponentSpec[];
}

export interface BoardSpec {
    sectors: SectorSpec[];
}
