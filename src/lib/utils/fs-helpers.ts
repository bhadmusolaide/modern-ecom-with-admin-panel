/**
 * Utility functions for file system operations
 * These functions help prevent "too many open files" errors by properly handling file descriptors
 */

import fs from 'fs';
import { promisify } from 'util';

// Promisify fs functions
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

/**
 * Safely read a directory with proper error handling
 * @param path Directory path to read
 * @returns Array of file names or empty array on error
 */
export async function safeReaddir(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch (error) {
    console.error(`Error reading directory ${path}:`, error);
    return [];
  }
}

/**
 * Safely check if a path exists and is a directory
 * @param path Path to check
 * @returns Boolean indicating if path exists and is a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Safely read a file with proper error handling
 * @param path File path to read
 * @returns File contents or null on error
 */
export async function safeReadFile(path: string): Promise<Buffer | null> {
  try {
    return await readFile(path);
  } catch (error) {
    console.error(`Error reading file ${path}:`, error);
    return null;
  }
}

/**
 * Safely write to a file with proper error handling
 * @param path File path to write to
 * @param data Data to write
 * @returns Boolean indicating success
 */
export async function safeWriteFile(path: string, data: string | Buffer): Promise<boolean> {
  try {
    await writeFile(path, data);
    return true;
  } catch (error) {
    console.error(`Error writing to file ${path}:`, error);
    return false;
  }
}