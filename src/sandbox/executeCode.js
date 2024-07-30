const Docker = require('dockerode');
const docker = new Docker();

async function executeCodeInSandbox(language, code, timeout = 30000) {
    let image, command;

    switch (language) {
        case 'python':
            image = 'python:3.9-slim';
            command = ['python', '-c', code];
            break;
        case 'javascript':
            image = 'node:14-slim';
            command = ['node', '-e', code];
            break;
        case 'java':
            image = 'openjdk:11-jdk-slim';
            command = [
                'sh',
                '-c',
                `echo "${code.replace(/"/g, '\\"')}" > Main.java && javac Main.java && java Main`,
            ];
            break;
        case 'ruby':
            image = 'ruby:slim';
            command = ['ruby', '-e', code];
            break;
        case 'c':
            image = 'gcc:latest';
            command = [
                'sh',
                '-c',
                `echo "${code}" > main.c && gcc main.c -o main && ./main`,
            ];
            break;
        case 'cpp':
            image = 'gcc:latest';
            command = [
                'sh',
                '-c',
                `echo "${code}" > main.cpp && g++ main.cpp -o main && ./main`,
            ];
            break;
        default:
            throw new Error('Unsupported language');
    }

    let container;
    try {
        // Create a Docker container
        container = await docker.createContainer({
            Image: image,
            Cmd: command,
            AttachStdout: true,
            AttachStderr: true,
            Tty: false,
            HostConfig: {
                Memory: 64 * 1024 * 1024, // 64MB
                CpuShares: 512,
                Binds: ['/dev/null:/dev/null'],
                NetworkMode: 'none',
                CapDrop: ['ALL'],
                SecurityOpt: ['seccomp=default.json'],
                NoNewPrivileges: true,
            },
        });

        await container.start();

        // Create a promise that resolves when logs are collected
        const outputPromise = containerLogs(container);

        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error('Execution timeout'));
            }, timeout);
        });

        // Wait for either the output or the timeout
        const { stdout, stderr } = await Promise.race([
            outputPromise,
            timeoutPromise,
        ]);

        const output = cleanOutput(stdout);
        const error = cleanOutput(stderr);

        return {
            output,
            error,
        };
    } catch (err) {
        console.error('Execution error:', err.message);
        throw err;
    } finally {
        if (container) {
            try {
                // Stop the container if it's still running
                const containerInfo = await container.inspect();
                if (containerInfo.State.Running) {
                    await container.stop();
                }
                // Remove the container
                await container.remove({ force: true });
            } catch (removeErr) {
                console.error('Failed to remove container:', removeErr.message);
            }
        }
    }
}

// Function to get logs from the container
function containerLogs(container) {
    return new Promise((resolve, reject) => {
        container.logs(
            {
                follow: true,
                stdout: true,
                stderr: true,
                stream: true,
            },
            (err, stream) => {
                if (err) {
                    return reject(err);
                }

                let stdout = '';
                let stderr = '';

                // Collect stdout and stderr separately
                stream.on('data', (chunk) => {
                    const output = chunk.toString('utf8');
                    const lines = output.split('\n');
                    lines.forEach((line) => {
                        // Check if line is from stderr or stdout based on known error patterns
                        if (line.match(/error|syntax|exception|traceback|cannot/i)) {
                            stderr += line + '\n';
                        } else {
                            stdout += line + '\n';
                        }
                    });
                });

                stream.on('end', () => {
                    resolve({ stdout, stderr });
                });

                stream.on('error', (err) => {
                    reject(err);
                });
            }
        );
    });
}

// Function to clean up output by removing non-printable characters
function cleanOutput(output) {
    return output.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}



module.exports = { executeCodeInSandbox };
