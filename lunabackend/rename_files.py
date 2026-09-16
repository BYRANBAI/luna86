#!/usr/bin/env python3
"""
Rename all files in a folder with various naming patterns.
"""

import os
import sys
from pathlib import Path
from typing import Optional


def rename_files(
    folder_path: str,
    pattern: str = "file_{counter}",
    start_counter: int = 1,
    preserve_extension: bool = True,
    dry_run: bool = False
) -> None:
    """
    Rename all files in a folder according to a pattern.
    
    Args:
        folder_path: Path to the folder containing files to rename
        pattern: Naming pattern. Use {counter} for numbering, {original} for original name
        start_counter: Starting number for counter
        preserve_extension: Keep original file extensions
        dry_run: Preview changes without actually renaming
    """
    folder = Path(folder_path)
    
    if not folder.exists():
        print(f"Error: Folder '{folder_path}' does not exist")
        return
    
    if not folder.is_dir():
        print(f"Error: '{folder_path}' is not a directory")
        return
    
    # Get all files (not directories) in the folder
    files = [f for f in folder.iterdir() if f.is_file()]
    
    if not files:
        print(f"No files found in '{folder_path}'")
        return
    
    # Sort files by name for consistent ordering
    files.sort(key=lambda x: x.name)
    
    counter = start_counter
    renamed_count = 0
    
    print(f"{'DRY RUN - ' if dry_run else ''}Renaming {len(files)} files in '{folder_path}':\n")
    
    for file in files:
        original_name = file.stem
        extension = file.suffix
        
        # Build new name
        new_name = pattern.replace("{counter}", str(counter).zfill(3))
        new_name = new_name.replace("{original}", original_name)
        
        # Add extension if preserving
        if preserve_extension and extension:
            new_name = f"{new_name}{extension}"
        
        new_path = folder / new_name
        
        # Skip if name hasn't changed
        if file.name == new_name:
            print(f"  SKIP: {file.name} (already has target name)")
            counter += 1
            continue
        
        # Check for conflicts
        if new_path.exists():
            print(f"  CONFLICT: {file.name} -> {new_name} (target exists)")
            counter += 1
            continue
        
        print(f"  {file.name} -> {new_name}")
        
        if not dry_run:
            try:
                file.rename(new_path)
                renamed_count += 1
            except Exception as e:
                print(f"    ERROR: {e}")
        else:
            renamed_count += 1
        
        counter += 1
    
    print(f"\n{'Would rename' if dry_run else 'Renamed'} {renamed_count} of {len(files)} files")


def main():
    """Main CLI interface."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Rename all files in a folder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Number files as file_001.ext, file_002.ext, etc.
  python rename_files.py /path/to/folder
  
  # Custom pattern with counter
  python rename_files.py /path/to/folder -p "image_{counter}"
  
  # Include original name
  python rename_files.py /path/to/folder -p "{original}_renamed"
  
  # Start counter at 10
  python rename_files.py /path/to/folder -s 10
  
  # Preview changes without renaming (dry run)
  python rename_files.py /path/to/folder --dry-run
  
  # Don't preserve extensions
  python rename_files.py /path/to/folder --no-extension
        """
    )
    
    parser.add_argument(
        "folder",
        help="Path to folder containing files to rename"
    )
    parser.add_argument(
        "-p", "--pattern",
        default="file_{counter}",
        help="Naming pattern (use {counter} and/or {original}). Default: file_{counter}"
    )
    parser.add_argument(
        "-s", "--start",
        type=int,
        default=1,
        help="Starting counter number. Default: 1"
    )
    parser.add_argument(
        "--no-extension",
        action="store_true",
        help="Don't preserve original file extensions"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without actually renaming files"
    )
    
    args = parser.parse_args()
    
    rename_files(
        folder_path=args.folder,
        pattern=args.pattern,
        start_counter=args.start,
        preserve_extension=not args.no_extension,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()
