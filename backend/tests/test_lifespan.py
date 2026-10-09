"""Verify graceful lifespan shutdown, including Windows interrupt cancellation."""

import asyncio
import unittest
from unittest.mock import patch

from app.main import app


class LifespanTest(unittest.IsolatedAsyncioTestCase):
    async def test_cancelled_receiver_completes_shutdown_and_cleans_workers(self):
        await self.run_lifespan(cancel=True)

    async def test_normal_shutdown_cleans_workers(self):
        await self.run_lifespan(cancel=False)

    async def run_lifespan(self, *, cancel):
        messages = []
        startup = asyncio.Event()
        incoming = asyncio.Queue()
        workers = []

        async def send(message):
            messages.append(message["type"])
            if message["type"] == "lifespan.startup.complete":
                startup.set()

        async def idle_worker(*args, **kwargs):
            workers.append(asyncio.current_task())
            await asyncio.Future()

        with (
            patch("app.main.initialize_development_database"),
            patch("app.main.check_database_connection"),
            patch("asyncio.to_thread", side_effect=idle_worker),
        ):
            await incoming.put({"type": "lifespan.startup"})
            task = asyncio.create_task(app.router.lifespan(
                {"type": "lifespan", "app": app, "state": {}},
                incoming.get,
                send,
            ))
            try:
                await asyncio.wait_for(startup.wait(), timeout=5)
                await asyncio.sleep(0)
                self.assertEqual(len(workers), 4)
                if cancel:
                    task.cancel()
                else:
                    await incoming.put({"type": "lifespan.shutdown"})
                await asyncio.wait_for(task, timeout=5)
            finally:
                if not task.done():
                    task.cancel()
                    await asyncio.gather(task, return_exceptions=True)

        self.assertEqual(messages, [
            "lifespan.startup.complete", "lifespan.shutdown.complete",
        ])
        self.assertTrue(all(worker.cancelled() for worker in workers))

    async def test_real_lifespan_errors_still_propagate(self):
        with (
            patch("app.main.initialize_development_database"),
            patch("app.main.check_database_connection"),
        ):
            with self.assertRaisesRegex(RuntimeError, "real failure"):
                async with app.router.lifespan_context(app):
                    raise RuntimeError("real failure")


if __name__ == "__main__":
    unittest.main()
