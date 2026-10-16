import { describe, it, expect, afterAll } from "bun:test";
import { fileStoreService } from "../src/services/fileStore.service.js";
import AdmZip from "adm-zip";

describe("FileStoreService", () => {
  const testProjectId = "test-proj-" + Math.random().toString(36).slice(2, 8);

  afterAll(async () => {
    await fileStoreService.deleteWorkspace(testProjectId);
  });

  it("should initialize workspace and write/read files", async () => {
    await fileStoreService.initWorkspace(testProjectId);

    const written = await fileStoreService.writeFile(
      testProjectId,
      "src/index.ts",
      "console.log('hello world');"
    );

    expect(written.path).toBe("src/index.ts");
    expect(written.content).toBe("console.log('hello world');");

    const read = await fileStoreService.readFile(testProjectId, "src/index.ts");
    expect(read.content).toBe("console.log('hello world');");
  });

  it("should reject path traversal attempts (.. escapes)", async () => {
    expect(() =>
      fileStoreService.resolveSafePath(testProjectId, "../../etc/passwd")
    ).toThrow();

    expect(() =>
      fileStoreService.resolveSafePath(testProjectId, "sub/../../secret.txt")
    ).toThrow();
  });

  it("should enforce maximum 2 MB file size limit", async () => {
    const oversizedBuffer = Buffer.alloc(2.5 * 1024 * 1024, "a");
    expect(
      fileStoreService.writeFile(testProjectId, "huge.txt", oversizedBuffer)
    ).rejects.toThrow();
  });

  it("should list hierarchical directory tree", async () => {
    await fileStoreService.writeFile(
      testProjectId,
      "nested/deep/file.py",
      "print('test')"
    );

    const tree = await fileStoreService.listTree(testProjectId);
    expect(Array.isArray(tree)).toBe(true);

    const nestedDir = tree.find((n) => n.name === "nested");
    expect(nestedDir).toBeDefined();
    expect(nestedDir?.type).toBe("directory");
  });

  it("should protect against Zip Slip during zip extraction", async () => {
    const zip = new AdmZip();
    zip.addFile("safe.txt", Buffer.from("safe content"));
    zip.addFile("dummy.txt", Buffer.from("malicious content"));
    // Explicitly set raw entryName to simulate malicious zip slip archive
    zip.getEntries()[1].entryName = "../../../malicious.txt";

    const zipBuffer = zip.toBuffer();
    const count = await fileStoreService.extractZip(testProjectId, zipBuffer);

    expect(count).toBe(1); // Only safe.txt extracted, malicious skipped

    const safeFile = await fileStoreService.readFile(testProjectId, "safe.txt");
    expect(safeFile.content).toBe("safe content");
  });

  it("should support custom workspace directory", async () => {
    const customProjId = "custom-proj-" + Math.random().toString(36).slice(2, 8);
    const customDir = `/tmp/forge-custom-test-${customProjId}`;
    fileStoreService.setWorkspaceDir(customProjId, customDir);

    expect(fileStoreService.getWorkspaceDir(customProjId)).toBe(customDir);

    await fileStoreService.initWorkspace(customProjId);
    await fileStoreService.writeFile(customProjId, "custom.txt", "custom content");
    await fileStoreService.deleteWorkspace(customProjId);
  });

  it("should browse host directories safely", async () => {
    const { projectService } = await import("../src/services/project.service.js");
    const result = await projectService.browseHostDirectories(process.cwd());
    expect(result.currentPath).toBe(process.cwd());
    expect(result.canWrite).toBe(true);
    expect(Array.isArray(result.directories)).toBe(true);
    expect(result.directories.length).toBeGreaterThan(0);
  });
});
