pipeline {
    agent any

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'GITHUB_LOGIN',
                    url: 'https://github.com/fintrust/fintrust.git'
            }
        }

        stage('Run Backend Tests and Coverage') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run coverage'
                }
            }
        }
        
        stage('Run Frontend Tests and Coverage') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npx vitest run --coverage'
                }
            }
        }

        stage('Run SonarQube Analysis') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'SONAR_TOKEN',
                        variable: 'SONAR_TOKEN'
                    )
                ]) {
                    sh '''
                        docker run --rm \
                            -e SONAR_TOKEN="$SONAR_TOKEN" \
                            -v "$(pwd):/usr/src" \
                            sonarsource/sonar-scanner-cli \
                            -Dsonar.projectKey=frank-org_fintrust \
                            -Dsonar.organization=frank-org \
                            -Dsonar.sources=backend/src,frontend/src \
                            -Dsonar.tests=backend/test,frontend/src \
                            -Dsonar.test.inclusions=backend/test/**,frontend/src/**/__tests__/**,frontend/src/**/*.test.js,frontend/src/**/*.test.jsx \
                            -Dsonar.exclusions=**/node_modules/**,**/coverage/** \
                            -Dsonar.coverage.exclusions=frontend/src/main.jsx \
                            -Dsonar.javascript.lcov.reportPaths=backend/coverage/lcov.info,frontend/coverage/lcov.info \
                            -Dsonar.host.url=https://sonarcloud.io
                    '''
                }
            }
        }

        stage ('Build Frontend Docker Image') {
            steps {
                dir('frontend') {
                    sh 'docker build -t fintrust-frontend-image:v1 .'                   
                }
            }
        }

        stage ('Build Backend Docker Image') {
            steps {
                dir('backend') {
                    sh 'docker build -t fintrust-backend-image:v1 .'
                }
            }
        }

        stage ('Login to DockerHub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'DOCKER_LOGIN',
                        usernameVariable: 'USERNAME',
                        passwordVariable: 'PASSWORD',
                    )
                ]){
                sh 'echo $PASSWORD | docker login -u $USERNAME --password-stdin'
                }
            
            }
        }

        stage ('Push to DockerHub') {
            steps {
                sh 'docker tag fintrust-frontend-image:v1 ekenefranklyn/fintrust-frontend-image:v1'
                sh 'docker push ekenefranklyn/fintrust-frontend-image:v1'
                sh 'docker tag fintrust-backend-image:v1 ekenefranklyn/fintrust-backend-image:v1'
                sh 'docker push ekenefranklyn/fintrust-backend-image:v1'
            }
        }

        stage ('Deploy to Application') {
            steps {
                sh 'docker compose up -d'
            }
        }
    }

    post {
        success {
            echo "Application Deployed Successfully! 🚀"
        }
        failure {
            echo "Deployment Failed. Check logs for details. ❌"
        }
    }
}