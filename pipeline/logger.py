import logging
import sys
from pathlib import Path

class PipelineLogger:
    # Custom logger wrapper to keep track of pipeline stage metrics and logs
    def __init__(self, log_file: Path = None):
        self.logger = logging.getLogger("ASG_Pipeline")
        self.logger.setLevel(logging.INFO)
        self.logger.handlers.clear()

        # Format string shows the time, level name, and the log message
        formatter = logging.Formatter(
            fmt="[%(asctime)s] [%(levelname)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        # Stream handler prints log messages to the console
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        self.logger.addHandler(console_handler)

        # File handler writes logs to a file on disk
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file, mode="w", encoding="utf-8")
            file_handler.setFormatter(formatter)
            self.logger.addHandler(file_handler)

        # Dictionary to store audit counts across all pipeline stages
        self.audit_counts = {}

    def info(self, msg: str):
        self.logger.info(msg)

    def warning(self, msg: str):
        self.logger.warning(msg)

    def error(self, msg: str):
        self.logger.error(msg)

    def record_metric(self, stage: str, metric_name: str, value: int):
        # Save metric counts for summary report
        if stage not in self.audit_counts:
            self.audit_counts[stage] = {}
        self.audit_counts[stage][metric_name] = value

    def print_audit_summary(self):
        # Print a summary of all metrics recorded during pipeline execution
        self.logger.info("AUDIT SUMMARY REPORT")
        for stage, metrics in self.audit_counts.items():
            self.logger.info(f"Stage [{stage}]:")
            for metric, val in metrics.items():
                self.logger.info(f"  - {metric}: {val}")
