import type {
  InterfaceOverridesMap,
  SchemaPath,
  TypeOverrideMap,
} from './types.ts';

export default class Statistics {
  private readonly typeStats: Record<string, number> = {};
  private readonly interfaceSelfStats: Record<string, number> = {};
  private readonly interfacePropertyStats: Record<
    string,
    Record<string, number>
  > = {};

  public incInterfaceSelfOverride(schemaPath: SchemaPath) {
    this.interfaceSelfStats[schemaPath] ??= 0;
    this.interfaceSelfStats[schemaPath]++;
  }

  public incInterfacePropertyOverride(
    schemaPath: SchemaPath,
    propertyName: string,
  ) {
    this.interfacePropertyStats[schemaPath] ??= {};
    this.interfacePropertyStats[schemaPath][propertyName] ??= 0;
    this.interfacePropertyStats[schemaPath][propertyName]++;
  }

  public incTypeOverride(schemaPath: SchemaPath) {
    this.typeStats[schemaPath] ??= 0;
    this.typeStats[schemaPath]++;
  }

  public findUnusedTypeOverrides(typeOverrides: TypeOverrideMap): string[] {
    return Object.keys(typeOverrides).filter((key) => !this.typeStats[key]);
  }

  public findUnusedInterfaceSelfOverrides(
    interfaceOverrides: InterfaceOverridesMap,
  ): string[] {
    return Object.entries(interfaceOverrides)
      .filter(
        ([key, overrides]) => overrides.self && !this.interfaceSelfStats[key],
      )
      .map(([key]) => key);
  }

  public findUnusedInterfacePropertyOverrides(
    interfaceOverrides: InterfaceOverridesMap,
  ): string[] {
    return Object.keys(interfaceOverrides).flatMap((interfacePath) =>
      this.findUnusedInterfacePropertyOverridesInInterface(
        interfaceOverrides,
        interfacePath as SchemaPath,
      ).map((p) => `${interfacePath}.${p}`),
    );
  }

  private findUnusedInterfacePropertyOverridesInInterface(
    interfaceOverrides: InterfaceOverridesMap,
    interfacePath: SchemaPath,
  ): string[] {
    const overrides = interfaceOverrides[interfacePath];
    if (!overrides || !overrides.properties) {
      return [];
    }

    return Object.entries(overrides.properties)
      .filter(
        ([property]) =>
          !this.interfacePropertyStats[interfacePath] ||
          !this.interfacePropertyStats[interfacePath][property],
      )
      .map(([property]) => property);
  }
}
