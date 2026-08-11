import { DomainError } from "./DomainError.js";
import type { Resource } from "./Resource.js";

/** Ship resource inventory (no authorization — callers gate access). */
export class ResourceCatalog {
  private readonly resources = new Map<string, Resource>();

  get count(): number {
    return this.resources.size;
  }

  getById(id: string): Resource {
    const resource = this.resources.get(id);
    if (!resource) {
      throw new DomainError(`Resource '${id}' was not found.`);
    }
    return resource;
  }

  findById(id: string): Resource | undefined {
    return this.resources.get(id);
  }

  getAll(options: { includeDecommissioned?: boolean } = {}): readonly Resource[] {
    const includeDecommissioned = options.includeDecommissioned ?? false;
    return [...this.resources.values()].filter(
      (resource) => includeDecommissioned || !resource.decommissioned,
    );
  }

  add(resource: Resource): Resource {
    if (this.resources.has(resource.id)) {
      throw new DomainError(`Resource '${resource.id}' already exists.`);
    }
    this.resources.set(resource.id, resource);
    return resource;
  }

  update(resource: Resource): Resource {
    if (!this.resources.has(resource.id)) {
      throw new DomainError(`Resource '${resource.id}' was not found.`);
    }
    this.resources.set(resource.id, resource);
    return resource;
  }

  decommission(id: string): Resource {
    const current = this.getById(id);
    if (current.decommissioned) {
      throw new DomainError(`Resource '${id}' is already decommissioned.`);
    }
    return this.update({ ...current, decommissioned: true });
  }
}
